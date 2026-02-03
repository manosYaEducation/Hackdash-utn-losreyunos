<?php

namespace App\Backend\Models;

use PDO;
use App\Backend\Models\Database;
use App\Backend\Models\DashboardModel;
use App\Backend\Models\TaskModel;
use App\Backend\Models\MemberModel;

class ProjectModel
{
    private $conn;
    private $dashboardModel;
    private $taskModel;
    private $memberModel;

    public function __construct()
    {
        $this->conn = Database::getInstance()->getConnection();
        $this->dashboardModel = new DashboardModel();
        $this->taskModel = new TaskModel();
        $this->memberModel = new MemberModel();
    }

// ***************************************************************
// [FIX DE SINCRONIZACIÓN 1]: Firma del método (10 argumentos)
// ***************************************************************
public function createProject(
    string $pitch,             // 1. Pitch
    string $dashboardSlug,     // 2. Dashboard Slug
    string $title,             // 3. Title
    string $description,       // 4. Description
    string $status,            // 5. Status
    string $groupName,         // 6. Nuevo: groupName
    string $linkVideo,         // 7. Nuevo: linkVideo
    string $linkDeploy,        // 8. Nuevo: linkDeploy
    string $membersData,       // 9. Nuevo: membersData
    ?string $imageData = null  // 10. Opcional, al final de la lista
): ?int {
    $dashboard = $this->dashboardModel->findBySlug($dashboardSlug);
    if (!$dashboard) {
        return null;
    }

    // ***************************************************************
    // [FIX DE SINCRONIZACIÓN 2]: Consulta SQL (10 columnas)
    // ***************************************************************
    $sql = "INSERT INTO projects (
                dashboard_id, 
                title, 
                description, 
                status, 
                image, 
                pitch,
                group_name,        /* Coincide con arg 6 */
                link_video,        /* Coincide con arg 7 */
                link_deploy,       /* Coincide con arg 8 */
                members_data       /* Coincide con arg 9 */
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"; // 10 placeholders

    $stmt = $this->conn->prepare($sql);
    
    // ***************************************************************
    // [FIX DE SINCRONIZACIÓN 3]: Array de Ejecución (10 valores en orden)
    // ***************************************************************
    $params = [
        $dashboard['id'],       // 1. dashboard_id
        $title,                 // 2. title
        $description,           // 3. description
        $status,                // 4. status
        $imageData,             // 5. image (NULL si no hay)
        $pitch,                 // 6. pitch
        $groupName,             // 7. group_name
        $linkVideo,             // 8. link_video
        $linkDeploy,            // 9. link_deploy
        $membersData            // 10. members_data
    ];
    
    if ($stmt->execute($params)) {
        return (int) $this->conn->lastInsertId();
    }
    return null;
}

public function getProjectById(int $projectId): ?array
{
    $stmt = $this->conn->prepare("SELECT p.*, d.slug as dashboard_slug FROM projects p JOIN dashboards d ON p.dashboard_id = d.id WHERE p.id = ?");
    $stmt->execute([$projectId]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($project && !empty($project['image'])) {
        $project['image'] = base64_encode($project['image']);
    }

    return $project ?: null;
}
    public function getProjectsByDashboardSlug(string $dashboardSlug): array
    {
        $dashboard = $this->dashboardModel->findBySlug($dashboardSlug);
        if (!$dashboard) {

            return [];
        }
        

    $stmt = $this->conn->prepare("SELECT * FROM projects WHERE dashboard_id = ? ORDER BY created_at DESC");
    $stmt->execute([$dashboard['id']]);
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($projects as &$project) {
        if (!empty($project['image'])) {
            $project['image'] = base64_encode($project['image']);
        }
    }

    return $projects;
}

public function updateProject(int $projectId, string $title, string $description, string $status, ?string $imageData = null, $pitch): bool
{
    if ($imageData !== null) {
        $stmt = $this->conn->prepare("UPDATE projects SET title = ?, description = ?, pitch = ?, status = ?, image = ? WHERE id = ?");
        return $stmt->execute([$title, $description, $pitch, $status, $imageData === '' ? null : $imageData, $projectId]);
    } else {
        $stmt = $this->conn->prepare("UPDATE projects SET title = ?, description = ?, pitch = ? , status = ? WHERE id = ?");
        return $stmt->execute([$title, $description, $pitch, $status, $projectId]);
    }
}
    public function deleteProject(int $projectId): bool
    {
        $stmt = $this->conn->prepare("DELETE FROM projects WHERE id = ?");
        return $stmt->execute([$projectId]);
    }

    public function getProjectStats(int $projectId): array
    {
        $tasks = $this->taskModel->getTasksByProjectId($projectId);
        $totalTasks = count($tasks);
        $completedTasks = count(array_filter($tasks, fn($task) => $task['status'] === 'completed'));


        $members = $this->memberModel->getMembersByProjectId($projectId);
        $totalMembers = count($members);
        

        $progress = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0;

        return [
            'progress' => $progress,
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'total_members' => $totalMembers, 
            'total_files' => 0 // Placeholder, requiere un FileModel
        ];
    }
}