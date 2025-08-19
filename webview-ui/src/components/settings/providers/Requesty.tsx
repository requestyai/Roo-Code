import { VSCodeCheckbox, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { useCallback, useEffect, useState } from "react"

import { type ProviderSettings, requestyDefaultModelId } from "@roo-code/types"

import type { RouterModels } from "@roo/api"
import type { OrganizationAllowList } from "@roo/cloud"

import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink"
import { Button } from "@src/components/ui"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { vscode } from "@src/utils/vscode"

import { toRequestyServiceUrl } from "@roo/utils/requesty"
import { ModelPicker } from "../ModelPicker"
import { inputEventTransform } from "../transforms"
import { RequestyBalanceDisplay } from "./RequestyBalanceDisplay"

type RequestyProps = {
	apiConfiguration: ProviderSettings
	setApiConfigurationField: (field: keyof ProviderSettings, value: ProviderSettings[keyof ProviderSettings]) => void
	routerModels?: RouterModels
	refetchRouterModels: () => void
	organizationAllowList: OrganizationAllowList
	modelValidationError?: string
}

export const Requesty = ({
	apiConfiguration,
	setApiConfigurationField,
	routerModels,
	refetchRouterModels,
	organizationAllowList,
	modelValidationError,
}: RequestyProps) => {
	const { t } = useAppTranslation()

	const [didRefetch, setDidRefetch] = useState<boolean>()

	const [requestyEndpointSelected, setRequestyEndpointSelected] = useState(!!apiConfiguration.requestyBaseUrl)

	// This ensures that the "Use custom URL" checkbox is hidden when the user deletes the URL.
	useEffect(() => {
		setRequestyEndpointSelected(!!apiConfiguration?.requestyBaseUrl)
	}, [apiConfiguration?.requestyBaseUrl])

	const handleInputChange = useCallback(
		<K extends keyof ProviderSettings, E>(
			field: K,
			transform: (event: E) => ProviderSettings[K] = inputEventTransform,
		) =>
			(event: E | Event) => {
				setApiConfigurationField(field, transform(event as E))
			},
		[setApiConfigurationField],
	)

	const getApiKeyUrl = () => {
		if (apiConfiguration?.requestyBaseUrl) {
			const appUrl = toRequestyServiceUrl(apiConfiguration.requestyBaseUrl, "app")
			return new URL("api-keys", appUrl).toString()
		}
		return "https://app.requesty.ai/api-keys"
	}

	return (
		<>
			<VSCodeTextField
				value={apiConfiguration?.requestyApiKey || ""}
				type="password"
				onInput={handleInputChange("requestyApiKey")}
				placeholder={t("settings:providers.getRequestyApiKey")}
				className="w-full">
				<div className="flex justify-between items-center mb-1">
					<label className="block font-medium">{t("settings:providers.requestyApiKey")}</label>
					{apiConfiguration?.requestyApiKey && (
						<RequestyBalanceDisplay
							baseUrl={apiConfiguration.requestyBaseUrl}
							apiKey={apiConfiguration.requestyApiKey}
						/>
					)}
				</div>
			</VSCodeTextField>
			<div className="text-sm text-vscode-descriptionForeground -mt-2">
				{t("settings:providers.apiKeyStorageNotice")}
			</div>
			{!apiConfiguration?.requestyApiKey && (
				<VSCodeButtonLink
					href={getApiKeyUrl()}
					style={{ width: "100%" }}
					appearance="primary">
					{t("settings:providers.getRequestyApiKey")}
				</VSCodeButtonLink>
			)}

			<VSCodeCheckbox
				checked={requestyEndpointSelected}
				onChange={(e: any) => {
					const isChecked = e.target.checked === true
					if (!isChecked) {
						setApiConfigurationField("requestyBaseUrl", undefined)
					}

					setRequestyEndpointSelected(isChecked)
				}}>
				{t("settings:providers.requestyUseCustomBaseUrl")}
			</VSCodeCheckbox>
			{requestyEndpointSelected && (
				<VSCodeTextField
					value={apiConfiguration?.requestyBaseUrl || ""}
					type="text"
					onInput={handleInputChange("requestyBaseUrl")}
					placeholder={t("settings:providers.getRequestyBaseUrl")}
					className="w-full">
					<div className="flex justify-between items-center mb-1">
						<label className="block font-medium">{t("settings:providers.getRequestyBaseUrl")}</label>
					</div>
				</VSCodeTextField>
			)}
			<Button
				variant="outline"
				onClick={() => {
					vscode.postMessage({ type: "flushRouterModels", text: "requesty" })
					refetchRouterModels()
					setDidRefetch(true)
				}}>
				<div className="flex items-center gap-2">
					<span className="codicon codicon-refresh" />
					{t("settings:providers.refreshModels.label")}
				</div>
			</Button>
			{didRefetch && (
				<div className="flex items-center text-vscode-errorForeground">
					{t("settings:providers.refreshModels.hint")}
				</div>
			)}
			<ModelPicker
				apiConfiguration={apiConfiguration}
				setApiConfigurationField={setApiConfigurationField}
				defaultModelId={requestyDefaultModelId}
				models={routerModels?.requesty ?? {}}
				modelIdKey="requestyModelId"
				serviceName="Requesty"
				serviceUrl="https://requesty.ai"
				organizationAllowList={organizationAllowList}
				errorMessage={modelValidationError}
			/>
		</>
	)
}
