import Vue from "vue";
import Vuex from "vuex";
import { IAppState } from "./modules/app";
import { IUserState } from "./modules/user";
import { ITaskState } from "./modules/task";
import { ICardState } from "./modules/card";
import { ILogState } from "./modules/log";
import { IWorkerState } from "./modules/worker";

Vue.use(Vuex);

export interface IRootState {
  app: IAppState;
  card:ICardState;
  log:ILogState;
  user: IUserState;
  task:ITaskState;
  worker:IWorkerState;
}

// Declare empty store first, dynamically register all modules later.
export default new Vuex.Store<IRootState>({});
