<?php

namespace App\Backend\Controllers;

use App\Backend\Models\ProjectModel;
use App\Backend\Models\DashboardModel;
use App\Backend\Models\TaskModel;
use App\Backend\Models\MemberModel;

class ProjectController
{
    private $projectModel;
    private $dashboardModel;
    private $taskModel;
    private $memberModel;

    public function __construct()
    {
        $this->projectModel = new ProjectModel();
        $this->dashboardModel = new DashboardModel();
        $this->taskModel = new TaskModel();
        $this->memberModel = new MemberModel();
    }

public function create() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        $this->sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
    }

    $title = $_POST['title'] ?? '';
    $description = $_POST['description'] ?? '';
    $status = $_POST['status'] ?? 'in_progress';
    $dashboardSlug = $_POST['slug'] ?? '';
    $pitch = $_POST['pitch'] ?? '';

    // ************************************************
    // LEYENDO LOS 4 NUEVOS CAMPOS DEL FRONTEND
    // ************************************************
    $groupName = $_POST['group_name'] ?? '';
    $linkVideo = $_POST['link_video'] ?? '';
    $linkDeploy = $_POST['link_deploy'] ?? '';
    $membersData = $_POST['members_data'] ?? '';
    // ************************************************

    if (empty($title) || empty($description) || empty($dashboardSlug)) {
        $this->sendJsonResponse(['success' => false, 'message' => 'Faltan datos requeridos'], 400);
    }

    $validStatuses = ['in_progress', 'completed'];
    if (!in_array($status, $validStatuses)) {
        $status = 'in_progress';
    }

    // Procesar imagen si fue subida
    $imageData = null;
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $imageTmpPath = $_FILES['image']['tmp_name'];
        $imageData = file_get_contents($imageTmpPath);
    }

    // ************************************************
    // [SOLUCIÓN] LLAMADA RE-ORDENADA DE 10 ARGUMENTOS
    // EL ORDEN DEBE COINCIDIR EXACTAMENTE CON EL MODELO (ProjectModel.php)
    // ************************************************
    $projectId = $this->projectModel->createProject(
        $pitch,             // 1. Pitch
        $dashboardSlug,     // 2. Dashboard Slug
        $title,             // 3. Title
        $description,       // 4. Description
        $status,            // 5. Status
        $groupName,         // 6. Nuevo: groupName
        $linkVideo,         // 7. Nuevo: linkVideo
        $linkDeploy,        // 8. Nuevo: linkDeploy
        $membersData,       // 9. Nuevo: membersData
        $imageData          // 10. ?string (Opcional, al final)
    );
    // ************************************************

    if ($projectId) {
        $this->sendJsonResponse(['success' => true, 'message' => 'Proyecto creado exitosamente', 'project_id' => $projectId], 201);
    } else {
        $this->sendJsonResponse(['success' => false, 'message' => 'Error al crear el proyecto o dashboard no encontrado.'], 500);
    }
}

public function createProjectsMember()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        $this->sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
        return;
    }

    $role = $_POST['role'] ?? 'member';
    $email = $_POST['email'] ?? '';
    $name = $_POST['name'] ?? '';
    $projectId = $_POST['project_id'] ?? null;

    if ($projectId === '' || $projectId === 'null') {
        $projectId = null;
    } else {
        $projectId = (int)$projectId;
    }

    if (empty($email) || empty($name)) {
        $this->sendJsonResponse(['success' => false, 'message' => 'Faltan datos requeridos'], 400);
        return;
    }

    $result = $this->memberModel->addProjectMember($projectId, $name, $email, $role);

    if ($result['success']) {
        $this->sendJsonResponse([
            'success' => true,
            'message' => 'Miembro de Proyecto creado exitosamente',
            'member_id' => $result['id']
        ], 201);
    } else {
        $message = $result['message'] ?? 'Error al crear el miembro de proyecto.';
        $statusCode = ($message === 'No puedes unirte a más de un proyecto.') ? 403 : 500;

        $this->sendJsonResponse([
            'success' => false,
            'message' => $message
        ], $statusCode);
    }
}

    public function getProjects()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
        }

        $dashboardSlug = $_GET['slug'] ?? null;
        if (!$dashboardSlug) {
            $this->sendJsonResponse(['success' => false, 'message' => 'Slug de dashboard requerido.'], 400);
        }

        $projects = $this->projectModel->getProjectsByDashboardSlug($dashboardSlug);

        $this->sendJsonResponse(['success' => true, 'data' => $projects], 200);
    }

    public function getTasks()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
        }

        $projectId = $_GET['id'] ?? null;
        if (!$projectId) {
            $this->sendJsonResponse(['success' => false, 'message' => 'ID de proyecto requerido.'], 400);
        }

        $tasks = $this->taskModel->getTasksByProjectId((int)$projectId);

        $this->sendJsonResponse(['success' => true, 'tasks' => $tasks], 200);
    }

    public function getProject()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
        }

        $projectId = $_GET['id'] ?? null;
        if (!$projectId) {
            $this->sendJsonResponse(['success' => false, 'message' => 'ID de proyecto requerido.'], 400);
        }

        $project = $this->projectModel->getProjectById((int)$projectId);

        if ($project) {
            $this->sendJsonResponse(['success' => true, 'project' => $project], 200);
        } else {
            $this->sendJsonResponse(['success' => false, 'message' => 'Proyecto no encontrado.'], 404);
        }
    }

public function update()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        $this->sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
    }

    $projectId = $_POST['id'] ?? null;
    $title = $_POST['title'] ?? '';
    $description = $_POST['description'] ?? '';
    $status = $_POST['status'] ?? 'in_progress';
    $pitch = $_POST['pitch'] ?? null;

    if (empty($projectId) || empty($title) || empty($description)) {
        $this->sendJsonResponse(['success' => false, 'message' => 'ID, título y descripción del proyecto son requeridos'], 400);
    }

    $validStatuses = ['in_progress', 'completed'];
    if (!in_array($status, $validStatuses)) {
        $status = 'in_progress';
    }

    $imageData = null;
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $imageTmpPath = $_FILES['image']['tmp_name'];
        $imageData = file_get_contents($imageTmpPath);
    }

    $result = $this->projectModel->updateProject((int)$projectId, $title, $description, $status, $imageData, $pitch);

    if ($result) {
        $this->sendJsonResponse(['success' => true, 'message' => 'Proyecto actualizado exitosamente'], 200);
    } else {
        $this->sendJsonResponse(['success' => false, 'message' => 'Error al actualizar el proyecto o no se encontró.'], 500);
    }
}

    public function delete()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
        }

        $projectId = $_POST['id'] ?? null;

        if (empty($projectId)) {
            $this->sendJsonResponse(['success' => false, 'message' => 'ID de proyecto requerido para eliminar.'], 400);
        }

        if ($this->projectModel->deleteProject((int)$projectId)) {
            $this->sendJsonResponse(['success' => true, 'message' => 'Proyecto eliminado exitosamente'], 200);
        } else {
            $this->sendJsonResponse(['success' => false, 'message' => 'Error al eliminar el proyecto o no se encontró.'], 500);
        }
    }

    public function getStats()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
        }

        $projectId = $_GET['id'] ?? null;
        if (!$projectId) {
            $this->sendJsonResponse(['success' => false, 'message' => 'ID de proyecto requerido.'], 400);
        }

        $stats = $this->projectModel->getProjectStats((int)$projectId);

        $this->sendJsonResponse(['success' => true, 'stats' => $stats], 200);
    }

    public function getFiles()
    {
        $this->sendJsonResponse(['success' => true, 'files' => []], 200);
    }

    public function getMembers()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
        }

        $projectId = $_GET['id'] ?? null;
        if (!$projectId) {
            $this->sendJsonResponse(['success' => false, 'message' => 'ID de proyecto requerido.'], 400);
        }

        $members = $this->memberModel->getMembersByProjectId((int)$projectId);

        $this->sendJsonResponse(['success' => true, 'members' => $members], 200);
    }

    public function getActivity()
    {
        $this->sendJsonResponse(['success' => true, 'activity' => []], 200);
    }

    private function sendJsonResponse($data, $statusCode = 200)
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    public function sendJoinRequest()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
             $this->sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
             }

        $projectId = $_POST['project_id'] ?? null;
        $name = $_POST['name'] ?? '';
        $email = $_POST['email'] ?? '';
        if (!$projectId || !$name || !$email) {
            $this->sendJsonResponse(['success' => false, 'message' => 'Faltan datos requeridos.'], 400);
        }

        $joinModel = new \App\Backend\Models\JoinRequestModel();
        $result = $joinModel->createRequest((int)$projectId, $name, $email);
        $statusCode = $result['success'] ? 201 : 400;
         $this->sendJsonResponse($result, $statusCode);
    }
    public function getJoinRequests()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
        }
        
        $projectId = $_GET['project_id'] ?? null;
        if (!$projectId) {
            $this->sendJsonResponse(['success' => false, 'message' => 'ID de proyecto requerido.'], 400);
        }

        $joinModel = new \App\Backend\Models\JoinRequestModel();
        $requests = $joinModel->getPendingRequests((int)$projectId);
        $this->sendJsonResponse(['success' => true, 'requests' => $requests], 200);
    }

    public function approveJoinRequest()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
        }

        $requestId = $_POST['request_id'] ?? null;
        if (!$requestId) {
            $this->sendJsonResponse(['success' => false, 'message' => 'ID de solicitud requerido.'], 400);
        }
        $joinModel = new \App\Backend\Models\JoinRequestModel();
        $request = $joinModel->getRequestById((int)$requestId);

        if (!$request || $request['status'] !== 'pending') {
            $this->sendJsonResponse(['success' => false, 'message' => 'Solicitud no encontrada o ya procesada.'], 404);
        }

        $memberResult = $this->memberModel->addProjectMember(
            (int)$request['project_id'],
            $request['user_name'],
            $request['email'],
            'member'
        );
        if (!$memberResult['success']) {
            $this->sendJsonResponse(['success' => false, 'message' => $memberResult['message']], 500);
        }

        $joinModel->updateStatus((int)$requestId, 'approved');
        $this->sendJsonResponse(['success' => true, 'message' => 'Solicitud aprobada y miembro agregado.'], 200);
    }

    public function rejectJoinRequest()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
        }

        $requestId = $_POST['request_id'] ?? null;
        if (!$requestId) {
            $this->sendJsonResponse(['success' => false, 'message' => 'ID de solicitud requerido.'], 400);
        }
        
        $joinModel = new \App\Backend\Models\JoinRequestModel();
        $request = $joinModel->getRequestById((int)$requestId);

        if (!$request || $request['status'] !== 'pending') {
        $this->sendJsonResponse(['success' => false, 'message' => 'Solicitud no encontrada o ya procesada.'], 404);
    }

    $joinModel->updateStatus((int)$requestId, 'rejected');
    $this->sendJsonResponse(['success' => true, 'message' => 'Solicitud rechazada.'], 200);
    }
    public function getFollowedProjects()
    {
    try {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
            return;
        }

        $email = $_GET['email'] ?? null;
        $email = strtolower(trim($email));
        if (!$email) {
            $this->sendJsonResponse(['success' => false, 'message' => 'Email requerido.'], 400);
            return;
        }
        $joinModel = new \App\Backend\Models\JoinRequestModel();
        $projects = $joinModel->getFollowedProjectsByEmail($email);

        $this->sendJsonResponse(['success' => true, 'projects' => $projects], 200);
    } catch (\Exception $e) {

        $this->sendJsonResponse([
            'success' => false,
            'message' => 'Ocurrió un error al obtener los proyectos seguidos.',
            'error' => $e->getMessage()
        ], 500);
    }
}

}