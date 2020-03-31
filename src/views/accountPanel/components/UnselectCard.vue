<template>
  <div>
    <div class="unselect-card__header">
      <span>Account:</span>
      <span>{{ currentCard.accountCode|| '' }}</span>
    </div>
    <div
      v-if="!isShowConfirmBlock"
      class="unselect-card"
    >
      <div class="unselect-card__body">
        <div>Are you sure to unselected this account?</div>
        <div>This will close the associated IE window, and any pending tasks of this account will no longer appear on this machine.</div>
      </div>
      <div class="unselect-card__footer">
        <el-button
          size="small"
          @click="handleUnselect"
        >
          Yes, unselect it
        </el-button>
        <el-button
          size="small"
          @click="handleCancel"
        >
          Cancel
        </el-button>
      </div>
    </div>

    <div
      v-if="isShowConfirmBlock"
      class="unselect-card-confirm"
    >
      <div class="unselect-card-confirm__body">
        <div style="color:#f56c6c">
          There is existing account:
          <strong>{{ currentCard.accountCode|| '' }}</strong>, login with new account will close the associated IE window. Any pending tasks of this account will no longer appear on this machine.
        </div>
        <div>Please confirm account selected and choose the method of login.</div>
        <div>Login process will open a new IE window, please do not close it.</div>
      </div>
      <div class="unselect-card-confirm__footer">
        <el-button
          size="small"
          @click="handleManualLogin"
        >
          Manual Login
        </el-button>
        <el-button
          size="small"
          :disabled="true"
        >
          Auto Login
        </el-button>
        <el-button
          size="small"
          @click="handleCancelInConfirm"
        >
          Cancel
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      isShowConfirmBlock: false
    };
  },
  computed: {
    ...mapGetters(["app", "card"]),
    currentCard() {
      return this.card.current;
    },
    accountStatus() {
      return this.app.account;
    }
  },
  methods: {
    async handleUnselect() {
      this.$store.commit("HANDLE_ACCOUNT_SHOWING_PAGE", "bank-card-search");
      this.$store.commit("HANDLE_TASK_AUTO_PROCESS", false);
      this.$store.commit("HANDLE_ACCOUNT_SIGN_IN_SUCCESS", false);
      this.$store.commit("HANDLE_TASK_VISIBLE", false);
      this.$store.commit("HANDLE_TASK_FETCHABLE", false);

      this.$store.commit("UNSET_CURRENT_CARD_DETAIL");
      await Promise.all([
        this.$store.dispatch("UnsetWorker"),
        this.$store.dispatch("UnsetCurrentCard")
      ]);
    },
    handleCancel() {
      this.$store.commit("HANDLE_ACCOUNT_SHOWING_PAGE", "bank-card-search");
    }
  }
};
</script>

<style lang="scss">
@import "../../../styles/variables.scss";
.unselect-card {
  padding: 0 64px;
  &__header {
    font-size: $fontLarge;
    text-align: center;
    margin: 16px 0;
  }
  &__body {
    div {
      margin: 16px 0;
    }
  }
  &__footer {
    text-align: center;
    .el-button {
      width: 130px;
    }
  }
}
</style>
<style lang="scss">
.unselect-card-confirm {
  padding: 0 64px;
  &__body {
    div {
      margin: 16px 0;
    }
  }
  &__footer {
    text-align: center;
    .el-button {
      width: 130px;
    }
  }
}
</style>
