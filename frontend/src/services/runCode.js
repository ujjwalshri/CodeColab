import axios
from "axios";

import { LANGUAGE_VERSIONS } from "../constants/languages.js";

export async function runCode(sourceCode, language){
    try {
        const response = await axios.post('https://emkc.org/api/v2/piston/execute',  {
            language: language,
            version: LANGUAGE_VERSIONS[language],
            files: [
              {
                content: sourceCode,
              },
            ],
          });

        console.log("Response from API:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error running code:", error);
        throw error;
    }
};