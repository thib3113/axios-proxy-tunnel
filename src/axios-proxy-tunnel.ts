import tunnel from 'tunnel'
import url, { UrlWithStringQuery } from 'url'
import * as axios from 'axios'

declare module 'axios' {
    interface AxiosProxyConfig {
        tunnel?: boolean
        headers?: Record<string, string>
    }
}

enum HTTPProtocols {
    HTTP = 'http',
    HTTPS = 'https'
}

interface UrlWithStringQueryFull extends UrlWithStringQuery {
    protocol: string
    hostname: string
}

const getProxyConfiguration = (
    config: axios.AxiosRequestConfig,
    parsedRequestUrl: UrlWithStringQueryFull
): axios.AxiosProxyConfig | false => {
    if (config.proxy) {
        if (!config.proxy.protocol) {
            config.proxy.protocol = parsedRequestUrl.protocol.slice(0, -1)
        }
        return config.proxy
    }
    let proxy: axios.AxiosProxyConfig | false = false

    // code come from axios : axios/lib/adapters/http.js:100 (some changes with comments)

    const proxyEnv = parsedRequestUrl.protocol.slice(0, -1) + '_proxy'
    const proxyUrl =
        process.env[proxyEnv] || process.env[proxyEnv.toUpperCase()]
    if (proxyUrl) {
        const parsedProxyUrl = url.parse(proxyUrl)
        const noProxyEnv = process.env.no_proxy || process.env.NO_PROXY
        let shouldProxy = true

        if (noProxyEnv) {
            const noProxy = noProxyEnv.split(',').map(function trim(s) {
                return s.trim()
            })

            shouldProxy = !noProxy.some(function proxyMatch(proxyElement) {
                if (!proxyElement) {
                    return false
                }
                if (proxyElement === '*') {
                    return true
                }
                if (
                    proxyElement[0] === '.' &&
                    parsedRequestUrl.hostname.substr(
                        parsedRequestUrl.hostname.length - proxyElement.length
                    ) === proxyElement &&
                    (proxyElement.match(/\./g) || '').length ===
                        (parsedRequestUrl.hostname.match(/\./g) || '').length
                ) {
                    return true
                }

                return parsedRequestUrl.hostname === proxyElement
            })
        }

        if (shouldProxy) {
            proxy = {
                protocol: (parsedProxyUrl.protocol || 'http:').slice(0, -1), // <= add protocol
                host: parsedProxyUrl.hostname,
                port: Number(parsedProxyUrl.port) // <= needed by typescript, but not coming from axios
            } as axios.AxiosProxyConfig

            if (parsedProxyUrl.auth) {
                const proxyUrlAuth = parsedProxyUrl.auth.split(':')
                proxy.auth = {
                    username: proxyUrlAuth[0],
                    password: proxyUrlAuth[1]
                }
            }
        }
    }

    return proxy
}

const axiosProxyTunnel = (
    instance: axios.AxiosInstance
): axios.AxiosInstance => {
    instance.interceptors.request.use(request => {
        if (request.proxy === false || !request.url) {
            return request
        }

        // let httpAgent
        let httpsAgent
        const parsed = url.parse(request.url)
        parsed.protocol = parsed.protocol || 'http:'

        const axiosProxy = getProxyConfiguration(request, {
            ...parsed,
            host: parsed.host || '',
            hostname: parsed.hostname || '',
            protocol: parsed.protocol || ''
        })
        // if no config proxy found and no HTTPS?_PROXY env
        if (!axiosProxy) {
            return request
        }

        const proxy = {
            host: axiosProxy.host, // Defaults to 'localhost'
            port: axiosProxy.port, // Defaults to 80

            // Basic authorization for proxy server if necessary
            proxyAuth:
                axiosProxy.auth &&
                axiosProxy.auth.password &&
                axiosProxy.auth.username
                    ? `${axiosProxy.auth.username}:${axiosProxy.auth.password}`
                    : undefined,

            // Header fields for proxy server if necessary
            headers: axiosProxy.headers || undefined
        }

        if (
            (axiosProxy.protocol || '').toLowerCase() === HTTPProtocols.HTTP &&
            parsed.protocol.slice(0, -1) === HTTPProtocols.HTTPS
        ) {
            // httpAgent = tunnel.httpOverHttp({ proxy });
            httpsAgent = tunnel.httpsOverHttp({ proxy })
        }
        // else if (axiosProxy.protocol.toLowerCase() === HTTPProtocols.HTTPS) {
        //     // httpAgent = tunnel.httpOverHttp({ proxy });
        //     // httpsAgent = tunnel.httpsOverHttp({ proxy });
        // }

        // request.httpAgent = httpAgent
        request.httpsAgent = httpsAgent
        request.proxy = false

        return request
    })

    return instance
}

export default axiosProxyTunnel
