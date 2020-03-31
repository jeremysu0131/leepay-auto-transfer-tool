const io = require("socket.io-client");

class SocketTool {
  constructor() {
    // this.ioClient = io.connect('http://www.bank-proxy-web-app.com');
    this.ioClient = io.connect("http://127.0.0.1:8000");
    this.ioClient.on("disconnect", () => {
      this.ioClient.close();
    });
  }

  /**
   * @param {String} bankname
   * @param {String} hostname
   * @param {Number} port
   * @return {Object}
   */
  ReceiveInterceptProxyUrlFromServer(bankname, hostname, port) {
    return new Promise((resolve, reject) => {
      this.ioClient.emit("proxy-client", { bankname, hostname, port });

      this.ioClient.on("proxy-server", messageFromServer => {
        resolve(messageFromServer);
      });

      setTimeout(() => {
        reject("Receive intercept proxy URL fail.");
      }, 1000 * 10);
    });
  }

  getCookieAndSession() {
    return new Promise(resolve => {
      this.ioClient.on("proxy-server", messageFromServer => {
        if (messageFromServer && messageFromServer.cookie != null) {
          resolve(messageFromServer);
        }
      });
    });
  }
}

export default SocketTool;
