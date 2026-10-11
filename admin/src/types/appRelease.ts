export interface AppRelease {
	app_key: string
	display_name: string
	download_url: string
	changelog: string
	version_name: string
	version_code: number
	updated_at: string
	updated_by: string | null
}

export interface AppReleasesResponse {
	releases: AppRelease[]
}

export interface PublishAppReleasePayload {
	displayName?: string
	downloadUrl: string
	changelog: string
	versionName: string
	versionCode: number
}
