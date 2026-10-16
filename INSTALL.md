# 安装 DSH Mini Usage

支持 DeepSeek Harness Desktop **0.2.0-rc.2**。安装前完全退出客户端。

## 发行包（推荐）

从本仓库 GitHub Releases 下载 `dsh-mini-usage.tgz`，然后执行：

```sh
dsh plugin --profile desktop add /path/to/dsh-mini-usage.tgz
```

## GitHub 源码安装

仓库已经包含 `lib/` 预构建产物，不需要执行构建脚本：

```sh
dsh plugin --profile desktop add github:zhongyichang1998/dsh-mini-usage
```

重新打开客户端后，点击侧栏底部的“用量”入口。在设置的插件管理中可禁用、启用插件。

## 卸载

退出客户端后执行：

```sh
dsh plugin --profile desktop remove dsh-mini-usage
```

卸载不会删除原始会话。派生统计缓存位于 DSH_HOME 的 `storages/dsh-mini-usage/index-v3.json`，可在停止宿主后自行删除，下次启用会从可用记录重建。

## 数据说明

首次启用需要读取可用历史，之后每五分钟刷新，也可手动刷新。`—` 表示没有记录或统计不可用；输入含读取和写入缓存的 Token，输出不重复累加推理 Token。只覆盖当前 DSH_HOME 内有持久化 Usage 的调用。
