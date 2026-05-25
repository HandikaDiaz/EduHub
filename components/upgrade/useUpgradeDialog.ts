"use client";

import { useContext } from "react";
import { UpgradeDialogContext } from "./UpgradeDialogContext";

export const useUpgradeDialog = () => useContext(UpgradeDialogContext);
