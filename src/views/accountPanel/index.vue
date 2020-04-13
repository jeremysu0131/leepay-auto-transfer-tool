<template>
  <div>
    <div class="info-header">
      <div class="info-header__current-account">
        <span>Current Account:</span>
        <span style="font-weight: bold">{{ card.currentDetail.accountCode|| ' - ' }}</span>
      </div>
      <el-button
        v-if="card.current.accountCode && app.account.showingPage !== 'unselect-card'"
        class="info-header__unselect-button"
        size="mini"
        @click="handleUnselectCurrentCard"
      >
        Unselect
      </el-button>
      <div class="info-header__group">
        <span>Account Group:</span>
        <span style="font-weight: bold">{{ card.currentDetail.channelGroup || ' - ' }}</span>
      </div>
    </div>
    <bank-card-search v-show="app.account.showingPage==='bank-card-search'" />
    <!-- <select-sign-in-type v-if="app.account.showingPage==='select-sign-in-type'" />
    <sign-in-to-bank v-if="app.account.showingPage==='sign-in-to-bank'" />
    <unselect-card v-if="app.account.showingPage==='unselect-card'" />
    <change-card v-if="app.account.showingPage==='change-card'" /> -->
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { BankCardSearch 
// ChangeCard, SelectSignInType, SignInToBank, UnselectCard
 } from "./components";
import { AppModule } from "../../store/modules/app";
import { AccountModule } from "../../store/modules/account";

@Component({
  name: "Layout",
  components: {
    BankCardSearch
    // ChangeCard,
    // SelectSignInType,
    // SignInToBank,
    // UnselectCard
  }
})
export default class extends Vue {
  get app() {
    return AppModule;
  }
  get card() {
    return AccountModule;
  }

  private handleSelect() {
    this.$store.commit("HANDLE_ACCOUNT_SHOWING_PAGE", "bank-card-search");
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
