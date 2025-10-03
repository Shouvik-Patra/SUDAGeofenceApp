import axios from 'axios';
import constants from './constants';

export async function getApi(url, header) {
  console.log('GetApi: ', `${constants.BASE_URL}/${url}`);

  return await axios.get(`${constants.BASE_URL}/${url}`, {
    headers: {
      Accept: header.Accept,
      'Content-Type': header.contenttype,
      'Authorization': header.accesstoken,
      // Authorization: `Bearer ${header.accesstoken ?? ''}`,
    },
  });
}

export async function getApiWithParam(url, param, header) {
  console.log('getApiWithParam: ', `${constants.BASE_URL}/${url}`);

  return await axios({
    method: 'GET',
    baseURL: constants.BASE_URL,
    url: url,
    params: param,
    headers: {
      Accept: header.Accept,
      'Content-type': header.contenttype,
    },
  });
}

export async function postApi(url, payload, header) {
  console.log('PostApi: ', `${constants.BASE_URL}/${url}`, payload);

  return await axios.post(`${constants.BASE_URL}/${url}`, payload, {
    headers: {
      Accept: header.Accept,
      'Content-Type': header.contenttype,
      'Authorization': header.accesstoken,
      // Authorization: `Bearer ${header.accesstoken ?? ''}`,
    },
  });
}
