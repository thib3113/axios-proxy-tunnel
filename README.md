# AXIOS-PROXY-TUNNEL

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Greenkeeper badge](https://badges.greenkeeper.io/thib3113/axios-proxy-tunnel.svg)](https://greenkeeper.io/)
[![Travis](https://img.shields.io/travis/thib3113/axios-proxy-tunnel.svg)](https://travis-ci.org/thib3113/axios-proxy-tunnel)
[![Coveralls](https://img.shields.io/coveralls/thib3113/axios-proxy-tunnel.svg)](https://coveralls.io/github/thib3113/axios-proxy-tunnel)
[![Dev Dependencies](https://david-dm.org/thib3113/axios-proxy-tunnel/dev-status.svg)](https://david-dm.org/thib3113/axios-proxy-tunnel?type=dev)

Create HTTPS tunnel through HTTP proxies (like corporate proxies)

Here is an example : 
```ts
import axios from 'axios';
import axiosProxyTunnel from 'axios-proxy-tunnel';

const myInstance = axiosProxyTunnel(axios.create());
```

And if you use an HTTP proxy (by setting `proxy` configuration, or by using environment vars), the package will change the httpsAgent, to use a tunnel .

Internally, this library use interceptors, if you want to change configuration with interceptors too, please use like this : 
```ts


import axios from 'axios';
import axiosProxyTunnel from 'axios-proxy-tunnel';

const myInstance = axios.create();

//all you want to do with your instance

axiosProxyTunnel(myInstance);

```

-----
For the moment, this library is just adapted to my needs, and maybe not ready in your cases . If you have ideas/problems, please create issue/PR 
 
