import { wrappedApi } from "../common/api";
import { store } from "./store";

const { UseApi, UseLazyApi } = wrappedApi({ store });

export const getArticledParsed = (url) => UseLazyApi('GET', `parser?url=${url}`);