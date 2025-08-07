<?php
require_once 'vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware {
    private $secret_key;
    private $db;

    public function __construct($db) {
        $this->db = $db;
        $this->secret_key = $_ENV['JWT_SECRET'] ?? 'secaudit-pro-jwt-secret-2024';
    }

    public function authenticate() {
        $headers = getallheaders();
        
        if (!isset($headers['Authorization'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Authorization header missing']);
            exit();
        }

        $auth_header = $headers['Authorization'];
        $token = str_replace('Bearer ', '', $auth_header);

        try {
            $decoded = JWT::decode($token, new Key($this->secret_key, 'HS256'));
            return $decoded;
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid token']);
            exit();
        }
    }

    public function generateToken($user_id, $email, $role) {
        $payload = [
            'iss' => 'secaudit-pro',
            'aud' => 'secaudit-pro-users',
            'iat' => time(),
            'exp' => time() + ($_ENV['JWT_EXPIRY'] ?? 86400), // Default 24 hours
            'user_id' => $user_id,
            'email' => $email,
            'role' => $role
        ];

        return JWT::encode($payload, $this->secret_key, 'HS256');
    }

    public function login($email, $password) {
        $query = "SELECT id, name, email, password, role, department FROM users WHERE email = :email";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (password_verify($password, $user['password'])) {
                // Update last login
                $update_query = "UPDATE users SET last_login = NOW() WHERE id = :id";
                $update_stmt = $this->db->prepare($update_query);
                $update_stmt->bindParam(':id', $user['id']);
                $update_stmt->execute();

                $token = $this->generateToken($user['id'], $user['email'], $user['role']);
                
                return [
                    'success' => true,
                    'token' => $token,
                    'user' => [
                        'id' => $user['id'],
                        'name' => $user['name'],
                        'email' => $user['email'],
                        'role' => $user['role'],
                        'department' => $user['department']
                    ]
                ];
            }
        }

        return ['success' => false, 'message' => 'Invalid credentials'];
    }

    public function requireRole($required_role) {
        $user = $this->authenticate();
        
        if ($user->role !== $required_role && $user->role !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            exit();
        }
        
        return $user;
    }
}