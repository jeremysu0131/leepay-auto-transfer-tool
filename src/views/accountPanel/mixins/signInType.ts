import { AppModule } from "../../../store/modules/app";
import { WorkerModule } from "../../../store/modules/worker";
import { Component, Vue } from "vue-property-decorator";

@Component
export default class SignInTypeMixin extends Vue {
  signInAutomatically() {
    AppModule.HANDLE_MANUAL_LOGIN(false);
    WorkerModule.SET_SIGN_IN_WORKFLOW(false);
    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("sign-in-to-bank");
    WorkerModule.RunAutoLoginFlows();
  }
  signInManually() {
    AppModule.HANDLE_MANUAL_LOGIN(true);
    WorkerModule.SET_SIGN_IN_WORKFLOW(true);
    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("sign-in-to-bank");
    WorkerModule.RunManualLoginFlows();
  }
}
