<template>
  <div class="top-header__container">
    <div class="top-header__operator">
      <span>Operator:</span>
      <span style="font-weight: bold">{{ name }}</span>
    </div>
    <div class="top-header__auto-process">
      <el-checkbox
        v-model="isProxySet"
        :disabled="!isProxySetEnable"
        @change="handleSetProxy"
      >
        Use Proxy
      </el-checkbox>
    </div>
    <div class="top-header__auto-process">
      <el-checkbox
        v-model="isAutoProcess"
        @change="handleAutoProcess"
      >
        Auto Process Task
      </el-checkbox>
    </div>
    <div class="top-header__dropdown">
      <el-dropdown
        trigger="click"
        @command="handleCommand"
      >
        <span class="el-dropdown-link">
          Settings
          <svg-icon icon-class="caret-down" />
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item disabled>
            System
          </el-dropdown-item>
          <el-dropdown-item
            divided
            command="signOutSystem"
          >
            Sign Out
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { MessageBox } from "element-ui";
import { AppModule } from "@/store/modules/app";
// import { WorkerModule } from '@/store/modules/worker';
import { UserModule } from "../../../store/modules/user";
import { TaskModule } from "../../../store/modules/task";

@Component({
  name: "TopHeader",
  mounted() {
    // this.$store.dispatch("CheckIsProxySet");
  }
})
export default class extends Vue {
  private bankSearchVisible = false;
  private waitingSecond = 5;
  private isAutoProcess = false;
  private isProxySet = false;

  get app() {
    return AppModule;
  }
  get name() {
    return UserModule.name;
  }
  // get card(){
  //   return AccountModule
  // }
  get task() {
    return TaskModule;
  }
  get isProxySetEnable() {
    return this.app.account.showingPage !== "account-search";
  }
  @Watch("app.task.isAutoProcess")
  onAutoProcessChanged(value: string, oldValue: string) {
    this.isAutoProcess = this.app.task.isAutoProcess;
  }

  @Watch("app.isProxySet")
  onProxySetChanged() {
    this.isProxySet = this.app.isProxySet;
  }

  private handleAutoProcess() {
    // This to prevent change isAutoProcess
    this.isAutoProcess = !this.isAutoProcess;
    if (this.app.task.isAutoProcess) {
      this.$confirm("This will disable auto process. Continue?", "Warning", {
        confirmButtonText: "OK",
        cancelButtonText: "Cancel",
        type: "warning"
      }).then(() => {
        this.$store.commit("HANDLE_TASK_AUTO_PROCESS", false);
      });
    } else {
      this.$confirm("This will enable auto process. Continue?", "Warning", {
        confirmButtonText: "OK",
        cancelButtonText: "Cancel",
        type: "warning"
      }).then(() => {
        this.$store.commit("HANDLE_TASK_AUTO_PROCESS", true);
      });
    }
  }
  private async handleSetProxy() {
    // This to prevent change isAutoProcess
    this.isProxySet = !this.isProxySet;
    if (this.isProxySet) {
      await this.$store.dispatch("UnsetProxy");
      this.isProxySet = false;
    } else {
      await this.$store.dispatch("SetProxy");
      this.isProxySet = true;
    }
  }
  private handleCommand(command: string) {
    switch (command) {
      case "signOutSystem":
        this.signOutSystem();
        break;

      default:
        break;
    }
  }
  private async signOutSystem() {
    await this.$store.dispatch("FedSignOut");
    await this.$store.dispatch("SignOut");
  }
}
</script>

<style lang="scss">
@import "../../../styles/variables.scss";
.top-header {
  &__container {
    font-size: $fontBase;
    display: flex;
    align-items: center;
    // justify-content: space-between;
    height: 49px;
    border-bottom: 1px solid #e2e2e2;
    padding: 0 8px;
  }
  &__operator {
    margin: 0 8px;
    flex-grow: 1;
  }
  &__auto-process {
    margin-right: 8px;
    order: 2;
  }
  &__dropdown {
    border-left: 1px solid #e2e2e2;
    padding-left: 8px;
    margin-right: 8px;
    order: 3;
  }
}
</style>
