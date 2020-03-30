<template>
  <el-row class="footer">
    <el-tabs type="card">
      <el-tab-pane label="Console">
        <div
          ref="console-box"
          style="height:145px;overflow:auto"
        >
          <div
            v-for="(log,index) in log.console"
            :key="index"
          >
            <div
              v-if="log.type==='success'"
              style="color:#67C23A"
            >
              {{ log.message }}
            </div>
            <div
              v-if="log.type==='warning'"
              style="color:#E6A23C"
            >
              {{ log.message }}
            </div>

            <div
              v-if="log.type==='danger'"
              style="color:#F56C6C"
            >
              {{ log.message }}
            </div>
            <div
              v-if="!log.type || log.type==='info'"
              style="color:#909399"
            >
              {{ log.message }}
            </div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="Log">
        <div style="height:105px;overflow:auto">
          <p
            v-for="(log,index) in log.log"
            :key="index"
          >
            {{ log }}
          </p>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-row>
</template>

<script>
import { mapGetters } from "vuex"

export default {
  computed: {
    ...mapGetters(["log"])
  },
  watch: {
    "log.console"() {
      this.$nextTick(() => {
        var consoleBox = this.$refs["console-box"]
        consoleBox.scrollTop = consoleBox.scrollHeight
      })
    }
  }
}
</script>

<style lang="scss">
.footer {
  $footer-tabs-height: 25px;
  height: 120px;

  .el-tabs {
    height: 100%;

    .el-tabs__header {
      margin-bottom: 0;
    }

    .el-tabs__item {
      height: $footer-tabs-height;
      line-height: $footer-tabs-height;
    }
  }
}
</style>

