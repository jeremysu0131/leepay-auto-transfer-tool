import Vue from "vue";
import Vuex from "vuex";
import { IAppState } from "./modules/app";
import { IUserState } from "./modules/user";
import { ITaskState } from "./modules/task";
import { IAccountState } from "./modules/account";
import { ILogState } from "./modules/log";
import { IWorkerState } from "./modules/worker";

Vue.use(Vuex);

export interface IRootState {
  app: IAppState;
  card:IAccountState;
  log:ILogState;
  user: IUserState;
  task:ITaskState;
  worker:IWorkerState;
}

// Declare empty store first, dynamically register all modules later.
export default new Vuex.Store<IRootState>({});
