import { LogModule } from "../../store/modules/log";

const { exec } = require("child_process");
const cwd =
  process.env.NODE_ENV === "production"
    ? process.resourcesPath + "/bankWorkerTool"
    : "bankWorkerTool";

export function setProxy(proxy: string) {
  // if (!proxy) return Promise.reject(new Error("Proxy is null"));

  // return new Promise((resolve, reject) => {
    // var child = exec(
    //   `BankWorkerTool.exe "REGITSTRY_TOOL" "SET_PROXY" "${proxy}:8800"`,
    //   // "BankWorkerTool.exe \"REGITSTRY_TOOL\" \"SET_PROXY\" \"4.3.2.1:8800\"",
    //   { shell: false, cwd }
    // );
    // child.on("error", (err: any) => reject(err));
    // child.on("exit", () => resolve());
  // });
}

export function unsetProxy() {}

export async function setIEEnvironment() {
  // try {
  // await setIEFeature();
  // await setIESecurityZones();
  // return true;
  // } catch (error) {
  // LogModule.SetLog({ level: "error", message: error });
  // return false;
  // }
}

// /**
//  * @returns {Promise<void>}
//  */
// function setIESecurityZones() {
//   return new Promise((resolve, reject) => {
//     regedit.putValue(
//       {
//         "HKCU\\SOFTWARE\\Microsoft\\Internet Explorer\\BrowserEmulation": {
//           IntranetCompatibilityMode: {
//             value: 1,
//             type: "REG_DWORD"
//           }
//         },
//         "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Zones\\1": {
//           2500: {
//             value: 3,
//             type: "REG_DWORD"
//           }
//         },
//         "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Zones\\2": {
//           2500: {
//             value: 3,
//             type: "REG_DWORD"
//           }
//         },
//         "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Zones\\3": {
//           2500: {
//             value: 3,
//             type: "REG_DWORD"
//           }
//         },
//         "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Zones\\4": {
//           2500: {
//             value: 3,
//             type: "REG_DWORD"
//           }
//         }
//       },
//       (err: any) => {
//         if (err) { return reject(new Error(`set secutity zones failure - ${err}`)); }
//         return resolve();
//       }
//     );
//   });
// }

// /**
//  * @returns {Promise<void>}
//  */
// function setIEFeature() {
//   return new Promise((resolve, reject) => {
//     regedit.createKey(
//       "HKLM\\SOFTWARE\\Wow6432Node\\Microsoft\\Internet Explorer\\Main\\FeatureControl\\FEATURE_BFCACHE",
//       (err: any) => {
//         if (err) {
//  return reject(
//             new Error(
//               `create key 'FEATURE_BFCACHE' failure - ${err.toString()}`
//             )
//           ); 
// }

//         return regedit.putValue(
//           {
//             "HKLM\\SOFTWARE\\Wow6432Node\\Microsoft\\Internet Explorer\\Main\\FeatureControl\\FEATURE_BFCACHE": {
//               "iexplore.exe": {
//                 value: 0,
//                 type: "REG_DWORD"
//               }
//             }
//           },
//           (putValueError: any) => {
//             if (putValueError) {
//  return reject(
//                 new Error(
//                   `set 'FEATURE_BFCACHE' failure - ${putValueError.toString()}`
//                 )
//               ); 
// }
//             return resolve();
//           }
//         );
//       }
//     );
//   });
// }
