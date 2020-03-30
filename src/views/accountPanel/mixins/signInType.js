export default {
  methods: {
    signInAutomatically() {
      this.$store.commit("HANDLE_MANUAL_LOGIN", false);
      this.$store.commit("SET_SIGN_IN_WORKFLOW", false);
      this.$store.commit("HANDLE_ACCOUNT_SHOWING_PAGE", "sign-in-to-bank");
      this.$store.dispatch("RunAutoLoginFlows");
    },
    signInManually() {
      this.$store.commit("HANDLE_MANUAL_LOGIN", true);
      this.$store.commit("SET_SIGN_IN_WORKFLOW", true);
      this.$store.commit("HANDLE_ACCOUNT_SHOWING_PAGE", "sign-in-to-bank");
      this.$store.dispatch("RunManualLoginFlows");
    }
  }
};
