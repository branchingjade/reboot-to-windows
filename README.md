# Reboot to Windows

[English](README.en.md) · **简体中文**

一个 [Decky Loader](https://decky.xyz) 插件：在 SteamOS 游戏模式下**一键重启进入 Windows 11**，
并且只生效一次 —— 下次开机自动回到 SteamOS，不会把机器“卡”在 Windows 里。

面向 Steam Deck / SteamOS 与 Windows 11 双系统（同一块硬盘、同一个 EFI 分区）的机器。

## 功能

- 在 Decky 侧边栏（QAM）一键切换：调用 `efibootmgr -n 0000` 设置 UEFI 的**一次性**启动项
  （`BootNext`），随后立即重启进入 Windows Boot Manager
- **一次性**：`BootNext` 是易失变量，用完即清，下一次开机仍然是正常的启动顺序（SteamOS）
- 面板显示当前引导状态：是否存在 Windows 引导条目、是否已经排队了切换
- 支持**取消**已排队的切换（`efibootmgr -N`），误触也能救回来
- 重启前有确认弹窗，避免手滑直接把正在玩的游戏重启掉
- **中英双语面板**，默认中文，可在面板里切换（选择会被记住）
- 自我修复：插件后端在每次加载时重建免密 sudo 规则，SteamOS 镜像更新抹掉 `/etc/sudoers.d/*` 后不会失效
- 纯 Python 后端，不捆绑任何二进制，不修改 Steam 文件

## 界面语言

面板底部有「语言 / Language」下拉框，可选 **中文**（默认）与 **English**，选择保存在本地。

## 安装

- **手动安装**：从 [Releases](https://github.com/branchingjade/reboot-to-windows/releases) 下载
  `RebootToWindows.zip`，在 Decky 设置 → 通用 → **从文件安装插件** 中选择它即可；
  或者解压到 `~/homebrew/plugins/`。
- **从源码部署**：把 `plugin.json`、`main.py`、`dist/` 复制到
  `~/homebrew/plugins/reboot-to-windows/`，然后在 Decky 面板里重启插件（或重启 Decky）。

## 工作原理

1. 后端调用 `efibootmgr` 读取启动项，确认存在 `Boot0000`（Windows Boot Manager）。
2. 点击按钮并确认后，执行 `efibootmgr -n 0000`，把 UEFI 的**一次性**启动项设为 Windows。
3. 立即执行 `systemctl reboot`。固件在这次启动时进入 Windows，并清除 `BootNext`。
4. 之后关机再开机，固件按正常的 `BootOrder` 回到 SteamOS。

## 权限：为什么不需要密码

Decky 3.x 默认把插件后端跑成**桌面用户**（`uid 1000`），而这个身份既不能读也不能写 UEFI 启动项。
所以本插件的 `plugin.json` 里声明了：

```json
"flags": ["root"]
```

Decky 会据此把后端以 **`uid 0`** 启动（已实测：`ps -o user,args -C python3` 显示后端为 `root`）。
在此前提下插件有两条互不依赖的可用路径，任何一条成立都不需要密码：

1. 是 root → 直接调用 `efibootmgr` 与 `systemctl reboot`，完全不碰 `sudo`；
2. 在加载时和每次切换前重建免密规则 `/etc/sudoers.d/zz-steamos-switch`（0440 root:root）：

```
deck ALL=(root) NOPASSWD: /usr/bin/efibootmgr
deck ALL=(root) NOPASSWD: /usr/bin/systemctl reboot
deck ALL=(root) NOPASSWD: /usr/bin/systemctl reboot *
```

SteamOS 的 `/etc` 是 overlay，镜像更新后会重建 upper 目录、抹掉自定义文件；插件下次加载会
自动写回该规则，所以这个故障不会复发。万一后端某天不是 root（例如手动改掉了 `flags`），
`sudo -n` 回退路径仍然可用；两条路都不通时，面板会明确提示 `needs_privileges`
（而不是只丢出一句 `sudo: a password is required`）。

> 手动安装的一键修复（只有在 root 标志失效时才需要）：
>
> ```bash
> sudo install -m 0440 -o root -g root /dev/stdin /etc/sudoers.d/zz-steamos-switch <<'EOF'
> deck ALL=(root) NOPASSWD: /usr/bin/efibootmgr
> deck ALL=(root) NOPASSWD: /usr/bin/systemctl reboot
> deck ALL=(root) NOPASSWD: /usr/bin/systemctl reboot *
> EOF
> ```

## 前置条件

- 机器是 Windows + SteamOS 双系统，且 Windows 引导条目是 `Boot0000`
  （一般由 Windows 安装程序创建，`Boot0000* Windows Boot Manager`）。
- 如果 Windows 的引导条目编号不是 `0000`，请修改 `main.py` 里的 `WINDOWS_BOOT_ENTRY`。

## 排错

日志：`~/homebrew/logs/Reboot to Windows/*.log`

- **「未检测到 Windows 引导条目」**：`efibootmgr` 输出里没有
  `Boot0000* Windows Boot Manager`。用 `efibootmgr -v` 看一下实际编号。
- **「读取 UEFI 引导项失败」/ `sudo: a password is required`**：后端没有 root 权限且免密规则丢了。
  确认 `plugin.json` 里的 `"flags": ["root"]` 没被改掉，并检查
  `/etc/sudoers.d/zz-steamos-switch` 是否存在（上方有手动修复命令）。
- **按了按钮但进了 SteamOS**：检查是否有别的工具清掉了 `BootNext`；也可以在点按钮后
  `efibootmgr | head -2` 确认 `BootNext: 0000` 已写入。

## 从源码构建

```bash
pnpm install
pnpm run build      # 生成 dist/index.js
```

Decky 实际加载的目录里需要 `plugin.json`、`main.py` 和 `dist/`。

## 更新日志

### 1.0.0

- 首个公开发布版本
- 一次性 `BootNext` 切换 + 立即重启，带确认弹窗
- 中英双语面板（默认中文）
- 面板内可取消已排队的切换
- 声明 `"flags": ["root"]`，后端以 root 启动并自我修复免密 sudo 规则
- 后端返回 `error_code`，由前端本地化错误文案

## 致谢

- 基于 [Decky 插件模板](https://github.com/SteamDeckHomebrew/decky-plugin-template)。
- 免密规则自愈的思路来自同作者在 SteamOS 上的实际踩坑记录。

## 许可

BSD-3-Clause，见 [LICENSE](LICENSE)。
