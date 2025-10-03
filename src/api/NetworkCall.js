import axios from 'axios';
import constants from "../utils/helpers/constants";

const url = `${constants.BASE_URL}`;
global.networkTime = 60000;

export default async function NetworkCall(
  endPoint,
  body,
  timeout = global.networkTime,
  useDefaultUrl = true,
  customHeaders = {}
) {
  try {
    const mUrl = useDefaultUrl ? url + endPoint : endPoint;
    
    console.log('Request URL:', mUrl);
    console.log('Request body:', body);
    console.log('Headers:', customHeaders);

    // Simple axios POST request
    const response = await axios({
      method: 'POST',
      url: mUrl,
      data: body,
      headers: customHeaders,
      timeout: timeout,
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);

    return response.data;

  } catch (error) {
    console.log('NetworkCall error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - please check your internet connection');
    } else if (error.response) {
      console.log('Server error:', error.response.status, error.response.data);
      throw new Error(`Server error: ${error.response.status}`);
    } else if (error.request) {
      console.log('No response received');
      throw new Error('No response from server - please check your internet connection');
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}