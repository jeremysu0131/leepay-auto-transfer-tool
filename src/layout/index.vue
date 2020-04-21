<template>
  <div>
    <top-header />
    <el-tabs
      v-model="showingTab"
      type="border-card"
      class="tabs"
    >
      <el-tab-pane
        name="accounts"
        label="Accounts"
      >
        <account-panel />
      </el-tab-pane>
      <el-tab-pane
        name="tasks"
        :label="taskPanelLabel"
        :disabled="!taskTabVisible"
      >
        <task-panel />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { mixins } from "vue-class-component";
import { DeviceType, AppModule } from "@/store/modules/app";
import { TopHeader } from "./components";
import AccountPanel from "@/views/accountPanel/index.vue";
import TaskPanel from "@/views/taskPanel/index.vue";
import ResizeMixin from "./mixin/resize";
import { TaskModule } from "../store/modules/task";

@Component({
  name: "Layout",
  components: {
    AccountPanel,
    TaskPanel,
    TopHeader
  }
})
export default class extends mixins(ResizeMixin) {
  private taskPanelLabel = "Task";

  get showingTab() {
    return AppModule.showingTab;
  }
  set showingTab(newValue) {
    AppModule.HANDLE_SHOWING_TAB(newValue);
  }

  get taskTabVisible() {
    return AppModule.task.isVisible;
  }
  get taskList() {
    return TaskModule.list;
  }

  @Watch("task.list")
  onTaskListChanged() {
    this.$nextTick(() => {
      if (this.taskList) {
        const totalTasks = this.taskList.length;
        // const processingTasks = this.task.list.filter(task => task.toolStatus === "processing").length;
        // this.taskPanelLabel = `Tasks ( total: ${totalTasks} / processing: ${processingTasks} )`;
        this.taskPanelLabel = `Tasks ( total: ${totalTasks} )`;
      }
    });
  }
}
</script>

<style lang="scss" scoped>
.app-wrapper {
  @include clearfix;
  position: relative;
  height: 100%;
  width: 100%;
}

.drawer-bg {
  background: #000;
  opacity: 0.3;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

.main-container {
  min-height: 100%;
  transition: margin-left 0.28s;
  margin-left: $sideBarWidth;
  position: relative;
}

.sidebar-container {
  transition: width 0.28s;
  width: $sideBarWidth !important;
  height: 100%;
  position: fixed;
  font-size: 0px;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;
  overflow: hidden;
}

.hideSidebar {
  .main-container {
    margin-left: 54px;
  }

  .sidebar-container {
    width: 54px !important;
  }
}

/* for mobile response 适配移动端 */
.mobile {
  .main-container {
    margin-left: 0px;
  }

  .sidebar-container {
    transition: transform 0.28s;
    width: $sideBarWidth !important;
  }

  &.openSidebar {
    position: fixed;
    top: 0;
  }

  &.hideSidebar {
    .sidebar-container {
      pointer-events: none;
      transition-duration: 0.3s;
      transform: translate3d(-$sideBarWidth, 0, 0);
    }
  }
}

.withoutAnimation {
  .main-container,
  .sidebar-container {
    transition: none;
  }
}
</style>
