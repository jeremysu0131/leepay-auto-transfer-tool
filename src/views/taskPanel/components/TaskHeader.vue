<template>
  <div class="task-list__container-header">
    <div class="current-account">
      <span>Current Account:</span>
      <span style="font-weight: bold;">{{ currentAccount.code || "" }}</span>
    </div>

    <div class="bo-balance">
      <span>BO Balance:</span>
      <span style="font-weight: bold;">{{ balanceInSystem }}</span>
      <!-- <span
        v-if="isFetchBoBalanceFail"
        style="color:#F56C6C"
      >
        <svg-icon icon-class="error" />Update Fail
      </span>-->
    </div>
    <div class="bo-balance">
      <span>Bank Balance:</span>
      <span style="font-weight: bold;">{{ balanceInOnlineBank }}</span>
    </div>
    <div class="bo-balance">
      <span>Bank Sign-In:</span>
      <span style="font-weight: bold;">{{ signInSuccessAt }}</span>
    </div>
    <div class="fetch-task">
      <el-button
        size="mini"
        :icon="fetchButton.icon"
        :type="fetchButton.type"
        :loading="app.task.isFetching"
        :disabled="!app.task.isAbleFetch"
        @click="fetchTasks"
      >
        {{ fetchTimer }}s
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Mixins } from "vue-property-decorator";
import dayjs from "dayjs";
import { AccountModule } from "@/store/modules/account";
import { TaskModule } from "@/store/modules/task";
import { UserModule } from "@/store/modules/user";
import { MessageBox } from "element-ui";
import { AppModule } from "@/store/modules/app";
import TaskOperationMixin from "../mixins/taskOperation";
import FetchTaskMixin from "../mixins/fetchTask";
import TaskStatusEnum from "../../../enums/taskStatusEnum";

@Component({
  name: "TaskHeader"
})
export default class extends Mixins(FetchTaskMixin, TaskOperationMixin) {
  beforeMount() {
    this.initFetchInterval();
  }
  beforeDestroy() {
    this.disposeFetchInterval();
  }

  get app() {
    return AppModule;
  }
  get currentAccount() {
    return AccountModule.current;
  }
  get task() {
    return TaskModule;
  }
  get name() {
    return UserModule.name;
  }
  get selectedTask() {
    return this.task.selectedDetail;
  }

  get balanceInSystem() {
    if (this.currentAccount.balance) {
      return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY"
      }).format(this.currentAccount.balance);
    }
    return "-";
  }
  get balanceInOnlineBank() {
    if (this.currentAccount.balanceInBank) {
      return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY"
      }).format(this.currentAccount.balanceInBank);
    }
    return "-";
  }
  get signInSuccessAt() {
    return this.currentAccount.id ? dayjs(this.currentAccount.signInSuccessAt).format("HH:mm:ss") : "-";
  }
}
</script>
