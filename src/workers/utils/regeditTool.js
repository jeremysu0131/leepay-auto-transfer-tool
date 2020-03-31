import regedit from "regedit";
import { setLog } from "./storeHelper";
regedit.setExternalVBSLocation("resources/regedit/vbs");

export function checkIsProxySet() {
  var internetSettings = "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";
  return new Promise((resolve, reject) => {
    regedit.list([internetSettings], (error, result) => {
      if (error) reject(error);
      resolve(result[internetSettings].values.ProxyEnable.value !== 0);
    });
  });
}

export function setProxy(proxy) {
  if (!proxy) return Promise.reject("Proxy is null");

  return new Promise((resolve, reject) => {
    regedit.putValue(
      {
        "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings": {
          ProxyEnable: {
            value: 1,
            type: "REG_DWORD",
          },
          ProxyOverride: {
            value:
              process.env.NODE_ENV === "development"
                ? "localhost; ops.leepayment.com"
                : "ops.leepayment.com; www.tcgpayment.com",
            type: "REG_SZ",
          },
          ProxyServer: {
            value: proxy + ":8800",
            type: "REG_SZ",
          },
        },
      },
      err => {
        if (err) reject(err);
        resolve();
      },
    );
  });
}

export function unsetProxy() {
  return new Promise((resolve, reject) => {
    regedit.putValue(
      {
        "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings": {
          ProxyEnable: {
            value: 0,
            type: "REG_DWORD",
          },
        },
      },
      err => {
        if (err) reject(err);
        resolve();
      },
    );
  });
}

export async function setIEEnviroment() {
  try {
    await setIEFeature();
    await setIESecurityZones();
    return true;
  } catch (error) {
    setLog({ level: "error", message: error });
    return false;
  }
}

/**
 * @returns {Promise<void>}
 */
function setIESecurityZones() {
  return new Promise((resolve, reject) => {
    regedit.putValue(
      {
        "HKCU\\SOFTWARE\\Microsoft\\Internet Explorer\\BrowserEmulation": {
          IntranetCompatibilityMode: {
            value: 1,
            type: "REG_DWORD",
          },
        },
        "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Zones\\1": {
          2500: {
            value: 3,
            type: "REG_DWORD",
          },
        },
        "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Zones\\2": {
          2500: {
            value: 3,
            type: "REG_DWORD",
          },
        },
        "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Zones\\3": {
          2500: {
            value: 3,
            type: "REG_DWORD",
          },
        },
        "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Zones\\4": {
          2500: {
            value: 3,
            type: "REG_DWORD",
          },
        },
      },
      err => {
        if (err) return reject(`set secutity zones failure - ${err}`);
        return resolve();
      },
    );
  });
}

/**
 * @returns {Promise<void>}
 */
function setIEFeature() {
  return new Promise((resolve, reject) => {
    regedit.createKey(
      "HKLM\\SOFTWARE\\Wow6432Node\\Microsoft\\Internet Explorer\\Main\\FeatureControl\\FEATURE_BFCACHE",
      err => {
        if (err) return reject(`create key 'FEATURE_BFCACHE' failure - ${err}`);

        return regedit.putValue(
          {
            "HKLM\\SOFTWARE\\Wow6432Node\\Microsoft\\Internet Explorer\\Main\\FeatureControl\\FEATURE_BFCACHE": {
              "iexplore.exe": {
                value: 0,
                type: "REG_DWORD",
              },
            },
          },
          putValueError => {
            if (putValueError) return reject(`set 'FEATURE_BFCACHE' failure - ${putValueError}`);
            return resolve();
          },
        );
      },
    );
  });
}
