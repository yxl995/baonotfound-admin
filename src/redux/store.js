import {createStore} from 'redux'
import {composeWithDevTools} from 'redux-devtools-extension'
import {persistCombineReducers, persistStore} from "redux-persist";
import storage from 'redux-persist/lib/storage'
import user from './reducers/user'

const reducers = persistCombineReducers({key: 'root', storage}, {user})
const store = createStore(reducers, composeWithDevTools())
export const persistor = persistStore(store)
export default store