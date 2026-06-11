package com.interviewprep.platform.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class OpenAiService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.url}")
    private String apiUrl;

    @Value("${openai.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean isApiKeyAvailable() {
        return apiKey != null && !apiKey.trim().isEmpty() && !apiKey.startsWith("${");
    }

    /**
     * Generates 10 interview questions based on resume text.
     */
    public List<String> generateQuestions(String resumeText) {
        if (!isApiKeyAvailable()) {
            System.out.println("OpenAI API key not found. Using mock questions fallback.");
            return generateMockQuestions(resumeText);
        }

        String prompt = "You are a senior software engineer interviewer.\n" +
                "Generate exactly 10 technical interview questions based on this resume text:\n" +
                "<resume_text>\n" +
                resumeText + "\n" +
                "</resume_text>\n" +
                "Return the output STRICTLY as a raw JSON array of objects, with each object having a 'question' key. " +
                "Example format: [{\"question\": \"Explain JWT authentication\"}]\n" +
                "Do not include markdown wrappers (e.g. ```json), explanation text, or extra characters. Just raw JSON.";

        try {
            String aiResponse = callOpenAi(prompt);
            String cleanedResponse = cleanJsonMarkdown(aiResponse);
            
            JsonNode rootNode = objectMapper.readTree(cleanedResponse);
            List<String> questions = new ArrayList<>();
            if (rootNode.isArray()) {
                for (JsonNode node : rootNode) {
                    if (node.has("question")) {
                        questions.add(node.get("question").asText());
                    }
                }
            }
            if (!questions.isEmpty()) {
                return questions;
            }
        } catch (Exception e) {
            System.err.println("Error generating questions from OpenAI: " + e.getMessage());
        }

        return generateMockQuestions(resumeText);
    }

    /**
     * Evaluates a user's answer to a question.
     */
    public Map<String, Object> evaluateAnswer(String question, String answer) {
        if (!isApiKeyAvailable()) {
            System.out.println("OpenAI API key not found. Using mock evaluation fallback.");
            return generateMockEvaluation(question, answer);
        }

        String prompt = "Evaluate this technical interview answer.\n" +
                "Question: " + question + "\n" +
                "Answer: " + answer + "\n\n" +
                "Provide feedback in raw JSON format with the following keys:\n" +
                "1. \"score\": an integer out of 10\n" +
                "2. \"strengths\": bullet points or paragraph summarizing what they did well\n" +
                "3. \"weaknesses\": bullet points or paragraph detailing what they missed\n" +
                "4. \"improvedAnswer\": a detailed, high-quality sample answer\n" +
                "Return the response strictly as a single JSON object. Example:\n" +
                "{\"score\": 8, \"strengths\": \"Good understanding.\", \"weaknesses\": \"Missed token expiration.\", \"improvedAnswer\": \"JWT is...\"}\n" +
                "Do not include markdown wrappers or extra characters.";

        try {
            String aiResponse = callOpenAi(prompt);
            String cleanedResponse = cleanJsonMarkdown(aiResponse);
            
            return objectMapper.readValue(cleanedResponse, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            System.err.println("Error evaluating answer from OpenAI: " + e.getMessage());
        }

        return generateMockEvaluation(question, answer);
    }

    private String callOpenAi(String userMessage) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "user", "content", userMessage));
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);

        String jsonPayload = objectMapper.writeValueAsString(requestBody);
        HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);

        ResponseEntity<String> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, String.class);
        
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            JsonNode responseJson = objectMapper.readTree(response.getBody());
            return responseJson.get("choices").get(0).get("message").get("content").asText();
        } else {
            throw new RuntimeException("OpenAI API returned non-200 status code: " + response.getStatusCode());
        }
    }

    private String cleanJsonMarkdown(String rawResponse) {
        String clean = rawResponse.trim();
        if (clean.startsWith("```")) {
            // Remove opening tag like ```json
            int firstNewline = clean.indexOf("\n");
            if (firstNewline != -1) {
                clean = clean.substring(firstNewline + 1);
            } else {
                clean = clean.substring(3);
            }
            // Remove closing tag ```
            if (clean.endsWith("```")) {
                clean = clean.substring(0, clean.length() - 3);
            }
        }
        return clean.trim();
    }

    // --- MOCK FALLBACKS ---

    private List<String> generateMockQuestions(String resumeText) {
        String lowerResume = resumeText.toLowerCase();
        List<String> pool = new ArrayList<>();

        if (lowerResume.contains("java") || lowerResume.contains("spring")) {
            pool.add("Explain the spring bean lifecycle and how Dependency Injection works.");
            pool.add("What is the difference between Optimistic and Pessimistic locking in Spring Data JPA?");
            pool.add("Explain JWT authentication, how the token is structured, and how security filters intercept it.");
            pool.add("What are the differences between ArrayList and LinkedList in Java, and when would you use which?");
            pool.add("How does Java's Garbage Collection work, and what are some common garbage collection algorithms?");
        }
        if (lowerResume.contains("react") || lowerResume.contains("javascript") || lowerResume.contains("next")) {
            pool.add("What are the advantages of React Server Components (RSC) in Next.js, and how do they differ from Client Components?");
            pool.add("Explain the event loop in JavaScript and how asynchronous operations (Promises, async/await) are handled.");
            pool.add("What is closures in JavaScript, and what are some common use cases?");
            pool.add("How does state management work in React, and when would you choose Context API over Redux?");
            pool.add("Explain the Virtual DOM in React and how the reconciliation process works.");
        }
        if (lowerResume.contains("database") || lowerResume.contains("sql") || lowerResume.contains("postgres")) {
            pool.add("Explain database normalization and define the first three normal forms.");
            pool.add("What are database indexes, how do B-Trees work, and what are the trade-offs of adding too many indexes?");
            pool.add("Explain the ACID properties of database transactions.");
            pool.add("How do you identify and resolve a N+1 query problem in an ORM like Hibernate?");
        }
        
        // General engineering pool if resume is short/generic
        pool.add("Describe the difference between REST and GraphQL APIs, detailing when to use each.");
        pool.add("What is Docker, and how do containers differ from Virtual Machines?");
        pool.add("What is horizontal vs. vertical scaling, and how would you design a highly available system?");
        pool.add("Explain the difference between SQL and NoSQL databases, and how you decide which one to use.");
        pool.add("What are some best practices for designing secure RESTful APIs?");
        pool.add("What is CI/CD, and why is it important in modern software development workflows?");
        pool.add("Explain git merge vs git rebase, and the pros/cons of each.");

        // Shuffle and take 10
        Collections.shuffle(pool);
        List<String> selected = new ArrayList<>();
        for (int i = 0; i < Math.min(10, pool.size()); i++) {
            selected.add(pool.get(i));
        }

        // Fill up to 10 if pool was too small
        while (selected.size() < 10) {
            selected.add("Describe a challenging technical project you worked on and how you overcame the obstacles.");
        }

        return selected;
    }

    private Map<String, Object> generateMockEvaluation(String question, String answer) {
        Map<String, Object> feedback = new HashMap<>();
        
        if (answer == null || answer.trim().length() < 10) {
            feedback.put("score", 2);
            feedback.put("strengths", "You provided an answer.");
            feedback.put("weaknesses", "The answer is extremely short or empty, lacking any technical detail or explanation.");
            feedback.put("improvedAnswer", "To improve, explain the core concepts. For example, if asked about JWT: 'JWT (JSON Web Token) is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information between parties as a JSON object. It consists of a Header, Payload, and Signature, and is typically stored in local storage or HTTP-only cookies to authenticate requests.'");
            return feedback;
        }

        int wordCount = answer.split("\\s+").length;
        int score = Math.min(10, Math.max(3, 4 + (wordCount / 15))); // score based on length for realism

        feedback.put("score", score);
        
        if (score >= 8) {
            feedback.put("strengths", "Solid explanation. You correctly identified the primary components and demonstrated good conceptual understanding of " + getSubjectFromQuestion(question) + ".");
            feedback.put("weaknesses", "Could expand slightly on implementation details, edge cases, and best practices in high-scale production systems.");
        } else if (score >= 6) {
            feedback.put("strengths", "Understands the basic definition and core concept.");
            feedback.put("weaknesses", "Missed important details such as security implications, trade-offs, and practical design patterns.");
        } else {
            feedback.put("strengths", "Attempted the question and covered the definition.");
            feedback.put("weaknesses", "Lacks depth. The explanation is vague and misses key technical terms associated with " + getSubjectFromQuestion(question) + ".");
        }

        feedback.put("improvedAnswer", generateMockImprovedAnswer(question));
        
        return feedback;
    }

    private String getSubjectFromQuestion(String question) {
        String q = question.toLowerCase();
        if (q.contains("jwt")) return "JWT authentication";
        if (q.contains("spring")) return "Spring Framework";
        if (q.contains("index")) return "database indexing";
        if (q.contains("scaling")) return "system scaling";
        if (q.contains("rest")) return "REST API design";
        if (q.contains("react")) return "React and frontend rendering";
        return "the requested topic";
    }

    private String generateMockImprovedAnswer(String question) {
        String q = question.toLowerCase();
        if (q.contains("jwt")) {
            return "JWT (JSON Web Token) is a standard method for securely transmitting digitally signed information. It contains three parts: a Header (algorithm and token type), a Payload (claims about user and roles), and a Signature (verifies issuer integrity). In a web application, users log in, the backend signs a JWT and returns it, and the client stores it (preferably in an HttpOnly cookie). Every subsequent request includes the token in the 'Authorization: Bearer <token>' header, allowing the backend to authenticate the user statelessly without querying the database.";
        }
        if (q.contains("spring bean") || q.contains("lifecycle")) {
            return "In Spring, a Bean is an object instantiated, configured, and managed by the Spring IoC Container. The lifecycle includes: 1) Instantiation (creating the object), 2) Populate Properties (Dependency Injection), 3) Aware interfaces calls (BeanNameAware, BeanFactoryAware), 4) BeanPostProcessor pre-initialization, 5) Initialization callback (@PostConstruct, InitializingBean's afterPropertiesSet), 6) BeanPostProcessor post-initialization. The bean is then ready for use. When the container closes, destruction lifecycle occurs (@PreDestroy, DisposableBean's destroy).";
        }
        if (q.contains("n+1")) {
            return "The N+1 query problem occurs in ORMs like Hibernate when you retrieve a parent list of entities and then query the database separately for each entity's child relationship (resulting in 1 query for parents + N queries for children). To fix this, you can: 1) Use JOIN FETCH in JPQL queries (e.g., 'SELECT s FROM Session s JOIN FETCH s.questions'), 2) Use EntityGraphs (@EntityGraph) to specify eager fetching for a specific action, or 3) Use Hibernate's batch fetch setting ('hibernate.default_batch_fetch_size').";
        }
        if (q.contains("virtual dom") || q.contains("react")) {
            return "The Virtual DOM is a lightweight, in-memory representation of the real DOM. When state changes in a React component, React creates a new virtual DOM tree, compares it with the previous tree (a process called 'Diffing' using a heuristic O(n) algorithm), and identifies the minimum set of changes. React then batches these changes and updates only those specific nodes in the real DOM (a process called 'Reconciliation'). This minimizes expensive write operations to the browser's DOM, resulting in faster rendering.";
        }
        return "To provide a senior-level answer, structure it into three parts: 1) Core Definition: Define the technology or concept precisely. 2) Mechanics: Explain how it works step-by-step under the hood. 3) Practical Context: Share production best practices, security considerations, or performance trade-offs. (e.g. for SQL vs NoSQL, compare schema rigidity, vertical vs horizontal scaling, ACID compliance vs BASE consistency, and use cases).";
    }
}
