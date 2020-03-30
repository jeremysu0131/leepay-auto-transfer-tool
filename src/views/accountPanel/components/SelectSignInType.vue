<template>
  <div class="select-sign-in-type">
    <div class="select-sign-in-type__title">
      <span>Account: {{ card.selected.accountCode }}</span>
    </div>
    <div class="select-sign-in-type__body">
      <div class="select-sign-in-type__body-prompt">
        <span>Balance:{{ card.selectedDetail.balanceInSystem? new Intl.NumberFormat('zh-CN', { style:'currency' ,currency: 'CNY' }).format(card.selectedDetail.balanceInSystem) :'-' }},</span>
        <span>Channel Group: {{ card.selectedDetail.channelGroup||'N/A' }}</span>
      </div>
      <div class="select-sign-in-type__body-prompt">Please confirm account selected and choose the method of Login.</div>
      <div class="select-sign-in-type__body-prompt">Login process will open a new IE window,please do not close it.</div>
    </div>
    <div class="select-sign-in-type__button-group">
      <el-button
        size="small"
        @click="signInManually"
      >Manual Login</el-button>
      <el-button
        size="small"
        @click="signInAutomatically"
      >Auto Login</el-button>
      <el-button
        size="small"
        @click="cancel"
      >Cancel</el-button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import signInType from "../mixins/signInType";
export default {
  name: "SelectSignInType",
  mixins: [signInType],
  data() {
    return {};
  },
  computed: {
    ...mapGetters(["app", "card", "worker"]),
  },
  mounted() {},
  methods: {
    cancel() {
      this.$store.commit("HANDLE_ACCOUNT_SHOWING_PAGE", "bank-card-search");
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../../../styles/variables.scss";

.select-sign-in-type {
  &__title {
    font-size: $fontLarge;
    text-align: center;
  }
  &__body {
    &-prompt {
      font-size: $fontBase;
      margin: 16px 0;
      text-align: center;
    }
  }
  &__button-group {
    margin: 32px 0 0;
    text-align: center;
  }
  &__footer {
    margin-top: 16px;
    text-align: center;
    &-button {
      width: 33%;
    }
  }
}
</style>