import axios from 'axios';
import constants from "../utils/helpers/constants";

const url = `${constants.BASE_URL}`;
global.networkTime = 60000;

export default async function NetworkGetCall(
  endPoint,
  queryParams = {},
  timeout = global.networkTime,
  useDefaultUrl = true,
  customHeaders = {}
) {
  try {
    const mUrl = useDefaultUrl ? url + endPoint : endPoint;
    
    console.log('GET Request URL:', mUrl);
    console.log('Query params:', queryParams);
    console.log('Headers:', customHeaders);

    // Simple axios GET request
    const response = await axios({
      method: 'GET',
      url: mUrl,
      params: queryParams, // Query parameters for GET request
      headers: customHeaders,
      timeout: timeout,
    });
    
    console.log('Response >>>>>>>:', response);

    return response.data;

  } catch (error) {
    console.error('NetworkGetCall error:', error);
  
  }
}