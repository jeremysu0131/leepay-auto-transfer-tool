<template>
  <div>
    <div class="info-header">
      <div class="info-header__current-account">
        <span>Current Account:</span>
        <span style="font-weight: bold">{{ account.current.code|| ' - ' }}</span>
      </div>
      <el-button
        v-if="account.current.code && showingPage !== 'unselect-card'"
        class="info-header__unselect-button"
        size="mini"
        @click="handleUnselectCurrentCard"
      >
        Unselect
      </el-button>
      <div class="info-header__group">
        <!-- <span>Account Group:</span> -->
        <!-- <span style="font-weight: bold">{{ account.current || ' - ' }}</span> -->
        <el-button
          size="mini"
          :icon="fetchButton.icon"
          :type="fetchButton.type"
          :loading="app.account.isFetching"
          @click="handleFetch"
        >
          Fetch
        </el-button>
      </div>
    </div>
    <account-search v-show="showingPage==='account-search'" />
    <select-sign-in-type v-if="showingPage==='select-sign-in-type'" />
    <sign-in-to-bank v-if="showingPage==='sign-in-to-bank'" />
    <unselect-card v-if="showingPage==='unselect-card'" />
    <!-- <change-card v-if="showingPage==='change-card'" /> -->
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import {
  AccountSearch,
  SelectSignInType,
  SignInToBank,
  // ChangeCard,
  UnselectCard
} from "./components";
import { AppModule } from "../../store/modules/app";
import { AccountModule } from "../../store/modules/account";

@Component({
  name: "Layout",
  components: {
    AccountSearch,
    // ChangeCard,
    SelectSignInType,
    SignInToBank,
    UnselectCard
  }
})
export default class extends Vue {
  private fetchButton = {
    icon: "el-icon-refresh",
    type: "default"
  };

  get showingPage() {
    return AppModule.account.showingPage;
  }
  get app() {
    return AppModule;
  }
  get account() {
    return AccountModule;
  }

  private async handleFetch() {
    try {
      AppModule.HANDLE_ACCOUNT_IS_FETCHING(true);
      var accounts = await AccountModule.GetAvailableAccount();
      AccountModule.SET_LIST(accounts);
    } finally {
      AppModule.HANDLE_ACCOUNT_IS_FETCHING(false);
    }
  }

  private handleSelect() {
    this.$store.commit("HANDLE_ACCOUNT_SHOWING_PAGE", "account-search");
  }
  private handleUnselectCurrentCard() {
    this.$store.commit("HANDLE_ACCOUNT_SHOWING_PAGE", "unselect-card");
  }
  private handleChange() {
    this.$store.commit("HANDLE_ACCOUNT_SHOWING_PAGE", "change-card");
  }
}
</script>

<style rel="stylesheet/scss" lang="scss">
@import "../../styles/variables.scss";
.info-header {
  font-size: $fontBase;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 16px;
  background-color: #f2f2f2;
  border-radius: 4px;
  height: 50px;
  margin-bottom: 15px;

  &__unselect-button {
    margin-left: 16px;
  }

  &__group {
    margin-left: 16px;
  }
}
</style>
