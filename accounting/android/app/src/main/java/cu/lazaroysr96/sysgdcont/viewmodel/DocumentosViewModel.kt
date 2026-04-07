package cu.lazaroysr96.sysgdcont.viewmodel

import android.content.Intent
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cu.lazaroysr96.sysgdcont.data.repository.DocumentStorageRepository
import cu.lazaroysr96.sysgdcont.data.repository.StoredDocument
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DocumentosUiState(
    val isLoading: Boolean = false,
    val documentos: List<StoredDocument> = emptyList(),
    val message: String? = null,
    val error: String? = null,
    val openIntent: Intent? = null,
    val shareIntent: Intent? = null
)

@HiltViewModel
class DocumentosViewModel @Inject constructor(
    private val documentStorageRepository: DocumentStorageRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DocumentosUiState())
    val uiState: StateFlow<DocumentosUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            runCatching { documentStorageRepository.listDocuments() }
                .onSuccess { documentos ->
                    _uiState.update { it.copy(isLoading = false, documentos = documentos) }
                }
                .onFailure { error ->
                    _uiState.update { it.copy(isLoading = false, error = error.message ?: "No se pudieron cargar los documentos") }
                }
        }
    }

    fun openDocument(document: StoredDocument) {
        runCatching {
            documentStorageRepository.buildViewIntent(
                documentStorageRepository.fileFromStoredDocument(document),
                document.mimeType
            )
        }.onSuccess { intent ->
            _uiState.update { it.copy(openIntent = intent, error = null) }
        }.onFailure { error ->
            _uiState.update { it.copy(error = error.message ?: "No se pudo abrir el documento") }
        }
    }

    fun shareDocument(document: StoredDocument) {
        runCatching {
            documentStorageRepository.buildShareIntent(
                documentStorageRepository.fileFromStoredDocument(document),
                document.mimeType
            )
        }.onSuccess { intent ->
            _uiState.update { it.copy(shareIntent = intent, error = null) }
        }.onFailure { error ->
            _uiState.update { it.copy(error = error.message ?: "No se pudo compartir el documento") }
        }
    }

    fun exportDocument(document: StoredDocument) {
        viewModelScope.launch {
            runCatching { documentStorageRepository.exportToDownloads(document) }
                .onSuccess { exported ->
                    _uiState.update {
                        it.copy(
                            message = "Documento exportado a ${exported.displayPath}",
                            error = null
                        )
                    }
                    refresh()
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(error = error.message ?: "No se pudo exportar el documento")
                    }
                }
        }
    }

    fun clearMessage() {
        _uiState.update { it.copy(message = null) }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun clearOpenIntent() {
        _uiState.update { it.copy(openIntent = null) }
    }

    fun clearShareIntent() {
        _uiState.update { it.copy(shareIntent = null) }
    }
}
