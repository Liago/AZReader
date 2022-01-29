import { wrappedApi } from "../common/api";
import { store } from "./store";
import { FIREBASE_API_KEY } from "../config/appSettings";

const { UseApi, UseLazyApi, UseLazyAuthApi } = wrappedApi({ store });

export const getArticledParsed = (url) => UseLazyApi('GET', `parser?url=${url}`);

export const signUpHandler = () => UseLazyAuthApi('POST', `v1/accounts:signUp?key=${FIREBASE_API_KEY}`)


