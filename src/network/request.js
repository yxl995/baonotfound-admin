import axios from "axios";

export function request(config) {
    const instance = axios.create({
        baseURL: "https://api.shop.eduwork.cn",
        timeout: 5000
    })
    return instance(config)
}

export function requestWithToken(config, token) {
    const instance = axios.create({
        baseURL: "https://api.shop.eduwork.cn",
        timeout: 5000,
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    return instance(config)
}