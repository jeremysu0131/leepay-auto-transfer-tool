// import WorkerFactory from "@/workers/index";
// import {
//   workflowEnum,
//   signInWorkflowEnum
// } from "../../../worker/utils/workflowHelper";
// import {
//   checkIsProxySet,
//   setProxy,
//   unsetProxy
// } from "../../../worker/utils/regeditTool";
import {
  VuexModule,
  Module,
  Mutation,
  Action,
  getModule
} from "vuex-module-decorators";
import store from "@/store";

export interface IWorkerState {
  workflow: any[];
}

@Module({ dynamic: true, store, name: "worker" })
class Worker extends VuexModule implements IWorkerState {
  public workflow = [];
}
export const WorkerModule = getModule(Worker);
// const worker = {
//   state: { runner: null, workflow: [], signInWorkflow: [] },

//   mutations: {
//     SET_WORKER: (state, runner) => {
//       state.runner = runner;
//     },
//     SET_SIGN_IN_WORKFLOW: (state, isManualSignIn) => {
//       state.signInWorkflow = signInWorkflowEnum(isManualSignIn);
//     },
//     // data: name, status
//     UPDATE_SIGN_IN_FLOW_STATUS: (state, data) => {
//       state.signInWorkflow.forEach(flow => {
//         if (flow.name === data.name) {
//           flow.status = data.status;
//         }
//       });
//       var signInWorkflow = state.signInWorkflow;
//       state.signInWorkflow = [];
//       state.signInWorkflow = signInWorkflow;
//     },
//     SET_WORKFLOW: (state, bankCode) => {
//       state.workflow = workflowEnum(bankCode);
//     },
//     // data: name, status
//     UPDATE_FLOW_STATUS: (state, data) => {
//       state.workflow.forEach(flow => {
//         if (flow.name === data.name) {
//           flow.status = data.status;
//         }
//       });
//       var workflow = state.workflow;
//       state.workflow = [];
//       state.workflow = workflow;
//     }
//   },

//   actions: {
//     async RunManualLoginFlows({ dispatch, commit }) {
//       commit("HANDLE_ACCOUNT_PROCESSING_SIGN_IN", true);
//       try {
//         await dispatch("SetIEEnviroment");
//         // await dispatch("SetProxy");
//         await dispatch("LaunchSelenium");
//       } catch (error) {
//         return commit("SET_LOG", { message: error, level: "error" });
//       } finally {
//         commit("HANDLE_ACCOUNT_PROCESSING_SIGN_IN", false);
//       }
//     },
//     async RunAutoLoginFlows({ dispatch, commit }) {
//       commit("HANDLE_TASK_AUTO_PROCESS", true);
//       commit("HANDLE_ACCOUNT_PROCESSING_SIGN_IN", true);
//       try {
//         await dispatch("SetIEEnviroment");
//         // await dispatch("SetProxy");
//         await dispatch("LaunchSelenium");
//         await dispatch("InputSignInInformation", { useCurrent: false });
//         await dispatch("SubmitToSignIn");
//         await dispatch("SendUSBKey");
//         await dispatch("CheckIfLoginSuccess");
//       } catch (error) {
//         commit("SET_LOG", { message: error, level: "error" });
//         return dispatch("SetConsole", {
//           level: "error",
//           message:
//             'Error happened during login, please login manually and click "confirm" button below when complete Note: the "auto process task" has been turned off as the result'
//         });
//       } finally {
//         commit("HANDLE_ACCOUNT_PROCESSING_SIGN_IN", false);
//       }
//     },
//     async RunAutoReloginFlows({ dispatch, commit }) {
//       commit("HANDLE_ACCOUNT_SIGN_IN_SUCCESS", false);
//       commit("HANDLE_ACCOUNT_PROCESSING_SIGN_IN", true);
//       commit("HANDLE_SHOWING_TAB", "accounts");
//       commit("HANDLE_ACCOUNT_SHOWING_PAGE", "sign-in-to-bank");
//       try {
//         await dispatch("LaunchSelenium");
//         await dispatch("InputSignInInformation", { useCurrent: true });
//         await dispatch("SubmitToSignIn");
//         await dispatch("SendUSBKey");
//         await dispatch("CheckIfLoginSuccess");
//       } catch (error) {
//         return dispatch("SetConsole", { message: error, level: "error" });
//       } finally {
//         commit("HANDLE_ACCOUNT_PROCESSING_SIGN_IN", false);
//       }
//     },
//     async RunAutoTransferFlows({ dispatch }) {
//       try {
//         await dispatch("GoTransferPage");
//         await dispatch("FillTransferFrom");
//         await dispatch("FillNote");
//         await dispatch("ConfirmTransaction");
//         return await dispatch("CheckIfSuccess");
//       } catch (error) {
//         dispatch("SetConsole", { message: error, level: "error" });
//         return false;
//       }
//     },
//     async RunManualTransferFlows({ dispatch }) {
//       try {
//         await dispatch("GoTransferPage");
//         await dispatch("FillTransferFrom");
//       } catch (error) {
//         return dispatch("SetConsole", { message: error, level: "error" });
//       }
//     },
//     async SetWorker({ commit, getters }) {
//       commit("SET_WORKER", new WorkerFactory(getters.card.selectedDetail));
//       commit("SET_WORKFLOW", getters.card.selectedDetail.accountCode);
//     },
//     async UnsetWorker({ commit, dispatch }) {
//       await dispatch("CloseSelenium");
//       commit("SET_WORKER", null);
//       commit("SET_WORKFLOW", null);
//     },
//     async SetIEEnviroment({ getters }) {
//       if (!(await getters.worker.runner.setIEEnviroment())) {
//         throw new Error("Set IE enviroment fail");
//       }
//     },
//     async CheckIsProxySet({ commit, dispatch }) {
//       try {
//         commit("HANDLE_PROXY_STATE", await checkIsProxySet());
//       } catch (error) {
//         return dispatch("SetConsole", { message: error, level: "error" });
//       }
//     },
//     async SetProxy({ getters }) {
//       if (!(await getters.worker.runner.setProxy())) {
//         throw new Error("Set proxy fail");
//       }
//     },
//     async UnsetProxy({ dispatch }) {
//       try {
//         await unsetProxy();
//       } catch (error) {
//         return dispatch("SetConsole", { message: error, level: "error" });
//       }
//     },
//     async LaunchSelenium({ getters }) {
//       return await getters.worker.runner.launchSelenium();
//     },
//     async CloseSelenium({ getters }) {
//       if (getters.worker.runner) await getters.worker.runner.closeSelenium();
//     },
//     async InputSignInInformation({ getters }, { useCurrent = false }) {
//       return await getters.worker.runner.inputSignInInformation(useCurrent);
//     },
//     async SubmitToSignIn({ getters }) {
//       return await getters.worker.runner.submitToSignIn();
//     },
//     async SendUSBKey({ getters }) {
//       await getters.worker.runner.sendUSBKey();
//     },
//     async CheckIfLoginSuccess({ commit, dispatch, getters }) {
//       const isManualLogin = getters.app.isManualLogin;
//       if (await getters.worker.runner.checkIfLoginSuccess({ isManualLogin })) {
//         commit("HANDLE_ACCOUNT_SHOWING_PAGE", "bank-card-search");
//         commit("HANDLE_ACCOUNT_SIGN_IN_SUCCESS", true);
//         commit("SET_SIGN_IN_SUCCESS_TIME", new Date());

//         commit("HANDLE_TASK_VISIBLE", true);
//         commit("HANDLE_TASK_FETCHABLE", true);
//         commit("HANDLE_SHOWING_TAB", "tasks");

//         // If selected card is empty, means this is called by relogin
//         if (getters.card.selected.id) {
//           dispatch("SetCurrentCard");
//         }
//         await Promise.all([
//           dispatch("GetBankBalance"),
//           dispatch("GetAllTasks")
//         ]);
//       }
//     },
//     async GetCookie({ commit, getters }) {
//       try {
//         await getters.worker.runner.getCookie();
//       } catch (error) {
//         commit("SET_LOG", { message: error, level: "error" });
//         throw error;
//       }
//     },
//     async GetBankBalance({ commit, getters }) {
//       try {
//         await getters.worker.runner.getBalance();
//       } catch (error) {
//         commit("SET_LOG", { level: "error", message: "Fail to get balance" });
//         commit("SET_LOG", { level: "error", message: error });
//       }
//     },
//     async GoTransferPage({ getters }) {
//       await getters.worker.runner.goTransferPage();
//     },
//     async FillTransferFrom({ getters }) {
//       await getters.worker.runner.fillTransferFrom();
//     },
//     async FillNote({ getters }) {
//       await getters.worker.runner.fillNote();
//     },
//     async ConfirmTransaction({ getters }) {
//       await getters.worker.runner.confirmTransaction();
//     },
//     async CheckIfSuccess({ getters }) {
//       return await getters.worker.runner.checkIfSuccess();
//     },
//     async RunSelectedFlow({ dispatch }, flowName) {
//       const publicWorkflowEnum = workflowEnum();
//       switch (flowName) {
//         case publicWorkflowEnum.SET_IE_ENVIROMENT:
//           return await dispatch("SetIEEnviroment");
//         case publicWorkflowEnum.SET_PROXY:
//           return await dispatch("SetProxy");
//         case publicWorkflowEnum.LAUNCH_SELENIUM:
//           return await dispatch("LaunchSelenium");
//         case publicWorkflowEnum.CLOSE_SELENIUM:
//           return await dispatch("CloseSelenium");
//         case publicWorkflowEnum.INPUT_SIGN_IN_INFORMATION:
//           return await dispatch("InputSignInInformation");
//         case publicWorkflowEnum.SUBMIT_TO_SIGN_IN:
//           return await dispatch("SubmitToSignIn");
//         case publicWorkflowEnum.SEND_USB_KEY:
//           return await dispatch("SendUSBKey");
//         case publicWorkflowEnum.CHECK_IF_LOGIN_SUCCESS:
//           return await dispatch("checkIfLoginSuccess");
//         case publicWorkflowEnum.GET_COOKIE:
//           return await dispatch("GetCookie");
//         case publicWorkflowEnum.GET_BALANCE:
//           return await dispatch("GetBankBalance");
//         case publicWorkflowEnum.GO_TRANSFER_PAGE:
//           return await dispatch("GoTransferPage");
//         case publicWorkflowEnum.FILL_TRANSFER_INFORMATION:
//           return await dispatch("FillTransferFrom");
//         case publicWorkflowEnum.FILL_NOTE:
//           return await dispatch("FillNote");
//         case publicWorkflowEnum.CONFIRM_TRANSACTION:
//           return await dispatch("ConfirmTransaction");
//         case publicWorkflowEnum.CHECK_IF_SUCCESS:
//           return await dispatch("CheckIfSuccess");
//         default:
//           throw new Error("No such workflow");
//       }
//     }
//   }
// };

// export default worker;
