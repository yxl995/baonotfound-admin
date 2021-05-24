let defaultUser = {
    email: '',
    password: '',
    token: ''
}
export default function userReducer(preState = defaultUser, action) {
    const {type, data} = action
    switch (type) {
        case 'email':
            return {
                email: data,
                password: preState.password,
                token: preState.token
            }
        case 'password':
            return {
                email: preState.email,
                password: data,
                token: preState.token
            }
        case 'token':
            return {
                email: preState.email,
                password: preState.password,
                token: data
            }
        default:
            return preState
    }
}