import TaskStatusEnum from "@/enums/taskStatusEnum";

export default class TaskCheckToolModel {
  id=0;
  status:string=TaskStatusEnum.TO_PROCESS;
}
