<template>
  <el-dialog
    title="Shipping address"
    :visible.sync="dialogVisible"
    :fullscreen="true"
    :before-close="handleClose"
  >
    <div class="workflow">
      <table class="workflow-table">
        <thead>
          <th>Status</th>
          <th>Step name</th>
        </thead>
        <tbody>
          <tr
            v-for="(flow,index) in signInWorkflow"
            :key="index"
            :style="flowStyle(flow.status)"
            @click="handleRowClick(flow)"
          >
            <td>
              <!-- <svg-icon :icon-class="iconClass(flow.status)" /> -->

              <svg-icon :name="iconClass(flow.status)" />
            </td>
            <td>{{ flow.name }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { WorkerModule } from "../../store/modules/worker";
import WorkflowStatusEnum from "@/models/WorkflowStatusEnum";
import { AppModule } from "../../store/modules/app";

@Component({
  name: "WorkflowDialog",
  mounted() {
    WorkerModule.SET_SIGN_IN_WORKFLOW(true);
  }
})
export default class extends Vue {
  get dialogVisible() {
    return AppModule.task.isProcessing;
  }

  get signInWorkflow() {
    return WorkerModule.signInWorkflow;
  }

  private handleClose() {
    AppModule.HANDLE_TASK_PROCESSING(false);
  }
  private async handleRowClick(row: any) {
    try {
      if (process.env.NODE_ENV === "development") {
        var result = await WorkerModule.RunSelectedFlow(row.name);
        console.log(result);
      }
    } catch (error) {
      this.$store.dispatch("SetConsole", {
        message: error.toString(),
        level: "debug"
      });
    }
  }

  private iconClass(status: WorkflowStatusEnum) {
    switch (status) {
      case WorkflowStatusEnum.RUNNING:
        return "workflow-running";
      case WorkflowStatusEnum.FAIL:
        return "workflow-fail";
      case WorkflowStatusEnum.SUCCESS:
        return "workflow-success";
      default:
        return "workflow-pending";
    }
  }
  private flowStyle(status: WorkflowStatusEnum) {
    console.log(status);
    switch (status) {
      case WorkflowStatusEnum.RUNNING:
        return { "background-color": "#E6A23C" };
      case WorkflowStatusEnum.FAIL:
        return { "background-color": "#F56C6C" };
      case WorkflowStatusEnum.SUCCESS:
        return { "background-color": "#67C23A" };
      default:
        return { "background-color": "" };
    }
  }
}
</script>

<style lang="scss">
.workflow {
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
</style>
