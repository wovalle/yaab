import axios, { AxiosRequestConfig } from 'axios';

export interface IHttpResult {
  ok?: any;
  result: any;
}
export interface IHttp {
  post(url: string, data: any, opts?: AxiosRequestConfig): Promise<IHttpResult>;
}

export default class Http implements IHttp {
  async post(
    url: string,
    data: any,
    opts?: AxiosRequestConfig
  ): Promise<IHttpResult> {
    return axios
      .post(url, data, opts)
      .then(response => response.data)
      .catch(e => Promise.reject(e.response.data || e.response));
  }
}
