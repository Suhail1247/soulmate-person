import axios from "axios";
axios.defaults.baseURL = "http://localhost:8080";

export async function generateOtp(number) {
  try {
    const response = await axios.post("/api/generateOtp", { number });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
}

export async function verifyOtp(otp) {
  try {
    const response = await axios.get("/api/verifyOtp", {
      params: { code: otp },
    });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error("Error in verify OTP:", error);
    throw error;
  }
}
export async function register(number, otp) {
  try {
    const response = await axios.post("/api/register", { number, otp });
   
    console.log(response.status);
    
    if (response.status === 201 && response.data.token) {
      await localStorage.setItem("token", response.data.token);
    }

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error("Error in verify OTP:", error);
    throw error;
  }
}


export async function submitDetails(response) {
  try {
    const token = await localStorage.getItem("token");
    const { data} = await axios.post("/api/submitDetails", response, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    return data;

  } catch (error) {
    console.error("Error on Submit:", error);
    return Promise.reject({ error: "Couldn't Submit" });
  }
}

export const fetchUserData = async () => {
  try {
    const token = await localStorage.getItem("token");
    const response = await axios.get("/api/getUser", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

export function calculateAge(birthdateString) {
  const birthdate = new Date(birthdateString);
  const currentDate = new Date();

  // Calculate the difference in years
  const age = currentDate.getFullYear() - birthdate.getFullYear();

  // Adjust the age if the birthdate hasn't occurred yet this year
  if (
    currentDate.getMonth() < birthdate.getMonth() ||
    (currentDate.getMonth() === birthdate.getMonth() &&
      currentDate.getDate() < birthdate.getDate())
  ) {
    return age - 1;
  } else {
    return age;
  }
}


export const submitPhotos=async(response)=>{
  try {
 
    const token = await localStorage.getItem("token");
console.log('start',response)
    const { data} = await axios.post("/api/submitPhotos",response ,{
      headers: {
        Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data' },
    });
    console.log('stop',data)
    return data;

  } catch (error) {
    console.error("Error on Submit:", error);
    return Promise.reject({ error: "Couldn't Submit" });
  }
}

export const submitDP=async(response)=>{
  try {
    const token = await localStorage.getItem("token");

    const { data} = await axios.post("/api/submitDP",response ,{
      headers: {
        Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data' },
    });
    console.log('adsfghtewkrdtulhrjeowdsiuh',data)
    return data;

  } catch (error) {
    console.error("Error on Submit:", error);
    return Promise.reject({ error: "Couldn't Submit" });
  }
}

export const fetchAllUserData = async () => {
  try {
    const token = await localStorage.getItem("token");
    const response = await axios.get("/api/getAllUsers", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const token = await localStorage.getItem("token");
    const response = await axios(`/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.status === 200) {
      throw new Error('Failed to fetch user data');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};