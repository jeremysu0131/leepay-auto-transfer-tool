<template>
  <div class="workflow">
    <table class="workflow-table">
      <thead>
        <th>Status</th>
        <th>Step name</th>
      </thead>
      <tbody>
        <tr
          v-for="(flow,index) in workflow"
          :key="index"
          :style="flowStyle(flow.status)"
          @click="handleRowClick(flow)"
        >
          <td>
            <svg-icon :name="iconClass(flow.status)" />
          </td>
          <td>{{ flow.name }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { WorkerModule } from "../../store/modules/worker";
import WorkflowStatusEnum from "../../enums/WorkflowStatusEnum";
import { AppModule } from "../../store/modules/app";
import { LogModule } from "../../store/modules/log";

@Component({
  name: "Workflow"
})
export default class extends Vue {
  get workflow() {
    return WorkerModule.workflow;
  }

  private async handleRowClick(row: any) {
    try {
      if (process.env.NODE_ENV === "development") {
        var result = await WorkerModule.RunFlow({
          name: row.name,
          args: { width: 800, height: 600 }
        });
        LogModule.SetLog({ level: "debug", message: row.name });
      }
    } catch (error) {
      LogModule.SetConsole({ level: "debug", message: error });
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
