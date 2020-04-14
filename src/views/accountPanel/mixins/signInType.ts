import { AppModule } from "../../../store/modules/app";
import { WorkerModule } from "../../../store/modules/worker";
import { Component, Vue } from "vue-property-decorator";

@Component
export default class SignInTypeMixin extends Vue {
  signInAutomatically() {
    AppModule.HANDLE_MANUAL_LOGIN(false);
    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("sign-in-to-bank");
    WorkerModule.RunAutoLoginFlows();
  }
  signInManually() {
    AppModule.HANDLE_MANUAL_LOGIN(true);
    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("sign-in-to-bank");
    WorkerModule.RunManualLoginFlows();
  }
}
