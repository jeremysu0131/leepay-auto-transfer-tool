<template>
  <div class="sign-in-to-bank__container">
    <div class="sign-in-to-bank__title">
      Account: {{ card.selected.accountCode }}
    </div>
    <div class="sign-in-to-bank__message">
      <span>Please wait for the initialization to complete and then manually login</span>
    </div>
    <div class="sign-in-to-bank__workflow">
      <table class="sign-in-to-bank__workflow-table">
        <thead>
          <th>Status</th>
          <th>Step name</th>
        </thead>
        <tbody>
          <tr
            v-for="(flow,index) in worker.signInWorkflow"
            :key="index"
            :style="flowStyle(flow.status)"
            @click="handleRowClick(flow)"
          >
            <td>
              <svg-icon :icon-class="iconClass(flow.status)" />
            </td>
            <td>{{ flow.name }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="sign-in-to-bank__message">
      <span :style="{color: checkResult.type==='error'?'#F56C6C':''}">{{ checkResult.message }}</span>
    </div>
    <div class="sign-in-to-bank__operator-buttons">
      <el-button
        size="small"
        :loading="isChecking"
        :style="{display: app.isManualLogin?'':'none'}"
        @click="checkIsSignedIn"
      >
        {{ isFirstTimeCheck?'Confirm Logged In':'Check again' }}
      </el-button>
      <el-button
        v-if="!isFirstTimeCheck"
        size="small"
        @click="ignoreCheck"
      >
        Skip checking, I have logged in
      </el-button>
      <el-button
        size="small"
        :disabled="app.account.isProcessingSignIn"
        @click="cancel"
      >
        Cancel
      </el-button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { workflowStatusEnum } from "../../../../worker/utils/workflowHelper";
import { getDetailById } from "@/api/card";
export default {
  data() {
    return {
      checkResult: {
        type: "",
        message: "Please click confirm button below after login"
      },
      isFirstTimeCheck: true,
      isChecking: false
    };
  },
  computed: {
    ...mapGetters(["app", "card", "worker"]),
    tableHeight() {
      return window.innerHeight - 60 - 60 - 60 - 120 - 2;
    }
  },
  async mounted() {},
  methods: {
    iconClass(status) {
      switch (status) {
        case workflowStatusEnum.RUNNING:
          return "workflow-running";
        case workflowStatusEnum.FAIL:
          return "workflow-fail";
        case workflowStatusEnum.SUCCESS:
          return "workflow-success";
        default:
          return "workflow-pending";
      }
    },
    flowStyle(status) {
      switch (status) {
        case workflowStatusEnum.RUNNING:
          return { "background-color": "#E6A23C" };
        case workflowStatusEnum.FAIL:
          return { "background-color": "#F56C6C" };
        case workflowStatusEnum.SUCCESS:
          return { "background-color": "#67C23A" };
        default:
          return { "background-color": "" };
      }
    },
    async checkIsSignedIn() {
      this.isChecking = true;
      this.checkResult.type = "";
      this.checkResult.message = "Checking login status, please wait ...";
      if (await this.$store.dispatch("CheckIfLoginSuccess")) {
        this.$message({ type: "success", message: "You have already loggin" });
        this.handleSignInSuccess();
      } else {
        this.checkResult.type = "error";
        this.checkResult.message =
          "Fail to verify login status, are you sure login is completed successfully?";
      }
      this.isChecking = false;
      this.isFirstTimeCheck = false;
    },
    ignoreCheck() {
      this.$confirm("This will ignore the checking method. Continue?", "Warning", {
        confirmButtonText: "OK",
        cancelButtonText: "Cancel",
        type: "warning"
      })
        .then(() => {
          this.handleSignInSuccess();
        })
        .catch(() => {});
    },
    handleSignInSuccess() {
      this.$store.commit("HANDLE_ACCOUNT_SHOWING_PAGE", "bank-card-search");
      this.$store.commit("HANDLE_ACCOUNT_SIGN_IN_SUCCESS", true);
      this.$store.commit("SET_SIGN_IN_SUCCESS_TIME", new Date());

      this.$store.commit("HANDLE_TASK_VISIBLE", true);
      this.$store.commit("HANDLE_TASK_FETCHABLE", true);
      this.$store.commit("HANDLE_SHOWING_TAB", "tasks");
      this.$store.dispatch("SetCurrentCard");
    },
    cancel() {
      this.$store.commit("HANDLE_ACCOUNT_SHOWING_PAGE", "bank-card-search");
    },
    async handleRowClick(val) {
      try {
        if (process.env.NODE_ENV === "development") { this.$store.dispatch("RunSelectedFlow", val.name); }
      } catch (error) {
        this.$store.dispatch("SetConsole", {
          message: error.toString(),
          level: "debug"
        });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import "../../../styles/variables.scss";

.sign-in-to-bank {
  &__container {
  }

  &__title {
    text-align: center;
    font-size: $fontLarge;
  }
  &__message {
    text-align: center;
    font-size: $fontBase;
    margin: 8px 0;
  }
  &__operator-buttons {
    margin: 16px 0 0;
    text-align: center;
  }
  &__workflow {
    border: 1px solid #e2e2e2;
    padding: 8px 16px 16px;
    width: 100%;
    &-table {
      border-collapse: collapse;
      width: 100%;

      th {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid #ddd;
        position: sticky;
        top: 0;
        z-index: 2;

        &:nth-child(1) {
          text-align: center;
        }
      }

      tr {
        &:hover {
          background-color: #f5f5f5;
        }

        td {
          padding: 8px 6px;
          text-align: left;
          border-bottom: 1px solid #e2e2e2;

          &:nth-child(1) {
            text-align: center;
          }
        }
      }
    }
  }
}
</style>
