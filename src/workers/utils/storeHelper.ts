// import store from "../../renderer/store";

// /**
//  *
//  * @param {Object} object
//  * @param {('error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly')} object.level
//  * @param {String} object.message
//  */
// export function LogModule.SetLog({ level, message }) {
//   store.LogModule.SetLog( { level, message });
// }

// export function setBankBalance(balance) {
//   store.commit("SET_BANK_BALANCE", balance);
// }

// /**
//  * Set cookie and session in store
//  * @param {Object} data
//  * @param {String} data.cookie
//  * @param {String} data.session
//  */
// export function setCookieAndSession(data) {
//   store.commit("SET_COOKIE", data.cookie);
//   store.commit("SET_SESSION", data.session);
// }

// /**
//  *
//  * @param {Object} data
//  * @param {String} data.name
//  * @param {String} data.status
//  */
// export function updateSignInFlowStatus(data) {
//   store.commit("UPDATE_SIGN_IN_FLOW_STATUS", {
//     name: data.name,
//     status: data.status
//   });
// }

// /**
//  *
//  * @param {Object} data
//  * @param {String} data.name
//  * @param {String} data.status
//  */
// export function WorkerModule.UPDATE_FLOW_STATUS(data) {
//   store.commit("UPDATE_FLOW_STATUS", {
//     name: data.name,
//     status: data.status
//   });
// }

// /**
//  *
//  * @typedef {Object} CardDetail
//  * @property {Number}  data.id
//  * @property {String}  data.accountCode
//  * @property {String}  data.bankCode
//  * @property {String}  data.balanceInSystem
//  * @property {String}  data.balanceInOnlineBank
//  * @property {String}  data.accountName
//  * @property {String}  data.accountPassword
//  * @property {String}  data.queryPassword
//  * @property {String}  data.usbPassword
//  * @property {String}  data.proxy
//  * @property {String}  data.cookie
//  * @property {String}  data.session
//  *
//  * @return {CardDetail} card detail
//  */
// export function getSelectedCardDetail() {
//   return store.state.card.selectedDetail;
// }
// /**
//  *
//  * @typedef {Object} CardDetail
//  * @property {Number}  data.id
//  * @property {String}  data.accountCode
//  * @property {String}  data.bankCode
//  * @property {String}  data.balanceInSystem
//  * @property {String}  data.balanceInOnlineBank
//  * @property {String}  data.accountName
//  * @property {String}  data.accountPassword
//  * @property {String}  data.queryPassword
//  * @property {String}  data.usbPassword
//  * @property {String}  data.proxy
//  * @property {String}  data.cookie
//  * @property {String}  data.session
//  *
//  * @return {CardDetail} card detail
//  */
// export function getCurrentCardDetail() {
//   return store.state.card.currentDetail;
// }

// /**
//  *
//  * @typedef {Object} TaskDetail
//  * @property {String} data.id
//  * @property {String} data.requestAmount
//  * @property {String} data.requestTime
//  * @property {String} data.receiverName
//  * @property {Object} data.bank
//  * @property {String} data.bank.chineseName
//  * @property {String} data.bank.englishName
//  * @property {String} data.bank.branch
//  * @property {String} data.bank.province
//  * @property {String} data.bank.city
//  * @property {String} data.bank.cardNumber
//  *
//  * @return {TaskDetail} task detail
//  */
// export function getSelectedTaskDetail() {
//   return store.state.task.selected;
// }
// export async function markTaskSuccess(charge) {
//   await store.this.MarkTaskSuccess", {
//     isHandleCurrentTask: true,
//     transferFee: charge,
//     note: "Mark by auto transfer tool"
//   });
// }

// export async function markTaskFail() {
//   // await store.this.MarkTaskSuccess");
// }
