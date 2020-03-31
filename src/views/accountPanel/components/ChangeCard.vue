
<template>
  <div>
    <div class="card">
      <div
        v-if="selectedCard.accountCode===currentCard.accountCode"
        class="reselect-card"
      >
        <div class="reselect-card__header">
          <span>Reselect Account:</span>
          <span>{{ selectedCard.accountCode|| '' }}</span>
        </div>
        <div class="reselect-card__body">
          <div style="color:#f56c6c">
            Login again with this current account will close previous IE window.
          </div>
          <div>Please choose the method of Login.</div>
          <div>Login process will open a new IE window, please do not close it.</div>
        </div>
      </div>
      <div
        v-if="selectedCard.accountCode!==currentCard.accountCode"
        class="change-card"
      >
        <div class="change-card__header">
          <span>New Account:</span>
          <span>{{ selectedCard.accountCode|| '' }}</span>
        </div>
        <div class="change-card__body">
          <div style="color:#f56c6c">
            Current Account is
            <strong>{{ currentCard.accountCode|| '' }}</strong>, this will close its associated IE window. Any pending tasks of this current account will no longer appear here afterwards.
          </div>
          <div>Please confirm account selected and choose the method of Login.</div>
          <div>Login process will open a new IE window, please do not close it.</div>
        </div>
      </div>
      <div class="card__footer">
        <el-button
          size="small"
          @click="handleManualLogin"
        >
          Manual Login
        </el-button>
        <el-button
          size="small"
          @click="handleAutoLogin"
        >
          Auto Login
        </el-button>
        <el-button
          size="small"
          @click="handleCancel"
        >
          Cancel
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { getDetailById } from "@/api/card";
export default {
  data() {
    return {};
  },
  computed: {
    ...mapGetters(["app", "card"]),
    currentCard() {
      return this.card.current;
    },
    selectedCard() {
      return this.card.selected;
    },
    accountStatus() {
      return this.app.account;
    }
  },
  methods: {
    async handleManualLogin() {
      await this.resetAccountStatus();
      this.$store.commit("HANDLE_MANUAL_LOGIN", true);
      this.$store.commit("SET_SIGN_IN_WORKFLOW", true);
      this.$store.commit("HANDLE_ACCOUNT_SHOWING_PAGE", "sign-in-to-bank");
      this.$store.dispatch("RunManualLoginFlows");
    },
    async handleAutoLogin() {
      await this.resetAccountStatus();
      this.$store.commit("HANDLE_MANUAL_LOGIN", false);
      this.$store.commit("SET_SIGN_IN_WORKFLOW", true);
      this.$store.commit("HANDLE_ACCOUNT_SHOWING_PAGE", "sign-in-to-bank");
      this.$store.dispatch("RunAutoLoginFlows");
    },
    handleCancel() {
      this.$store.commit("HANDLE_ACCOUNT_SHOWING_PAGE", "bank-card-search");
    },
    async resetAccountStatus() {
      this.$store.commit("HANDLE_TASK_FETCHABLE", false);
      this.$store.commit("HANDLE_ACCOUNT_SIGN_IN_SUCCESS", false);
    }
  }
};
</script>

<style lang="scss">
@import "../../../styles/variables.scss";
.change-card {
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
}
.reselect-card {
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
}
.card {
  padding: 0 64px;
  &__footer {
    text-align: center;
    .el-button {
      width: 130px;
    }
  }
}
</style>
