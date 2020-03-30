<template>
  <el-dialog
    title="Mark Task as Fail"
    :visible="app.task.isShowMarkAsFailDialog"
    width="80%"
    @close="closeDialog"
  >
    <el-form
      ref="taskFailForm"
      :model="form"
      :rules="rules"
      label-position="right"
      @submit.native.prevent
    >
      <el-form-item
        label="Note"
        label-width="60px"
      >
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="4"
        />
      </el-form-item>
    </el-form>
    <div
      slot="footer"
      class="dialog-footer"
    >
      <el-button
        type="danger"
        size="small"
        :loading="isHandlingFail"
        @click="handleConfirm"
      >
        Confirm
      </el-button>
      <el-button
        size="small"
        @click="closeDialog"
      >
        Cancel
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: "TaskFailDialog",
  data() {
    return {
      isHandlingFail: false,
      form: {
        transferFee: "0",
        note: ""
      },
      rules: {
        transferFee: [{ required: true, trigger: "blur" }]
      }
    };
  },
  computed: {
    app() {
      return this.$store.state.app;
    },
    task() {
      return this.$store.state.task;
    }
  },
  methods: {
    handleConfirm() {
      this.$refs.taskFailForm.validate(async valid => {
        if (valid) {
          await this.setTaskAsFail();
        } else {
          return false;
        }
      });
    },
    async setTaskAsFail() {
      try {
        this.isHandlingFail = true;
        // If true, means handle current task
        const isHandleCurrentTask = this.task.selectedDataForAPI === this.task.dataForAPI;

        await this.$store.dispatch("MarkTaskFail", {
          isHandleCurrentTask,
          reason: this.form.note
        });

        this.$message.success("Task has been mark as fail");
        this.closeDialog();
      } catch (error) {
        this.$message.error(error.toString());
      } finally {
        this.isHandlingFail = false;
      }
    },
    closeDialog() {
      this.$store.commit("HANDLE_MARK_AS_FAIL_DIALOG", false);
      this.$store.commit("HANDLE_TASK_HANDLING", false);

      this.form = { reason: "" };
    }
  }
};
</script>
<style lang="scss" scoped>
.dialog-footer {
  text-align: center;
}
</style>
