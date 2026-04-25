package com.smartcampus.service.Auth;

import com.smartcampus.model.Auth.User;
import com.smartcampus.repository.Auth.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        Optional<User> userOpt = userRepository.findByEmail(email);
        User persistedUser;
        if (userOpt.isEmpty()) {
            // Register new user from Google
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setName(name);
            newUser.setPictureUrl(picture);
            newUser.setRole("USER");
            // Set a dummy password for OAuth2 users as it's required by the model/db but
            // not used for login
            newUser.setPassword(UUID.randomUUID().toString());
            persistedUser = userRepository.save(newUser);
        } else {
            // Update existing user if name or picture changed
            User user = userOpt.get();
            boolean updated = false;
            if (name != null && !name.equals(user.getName())) {
                user.setName(name);
                updated = true;
            }
            if (picture != null && !picture.equals(user.getPictureUrl())) {
                user.setPictureUrl(picture);
                updated = true;
            }
            if (updated) {
                persistedUser = userRepository.save(Objects.requireNonNull(user, "Persisted user cannot be null"));
            } else {
                persistedUser = user;
            }
        }

        User authUser = Objects.requireNonNull(persistedUser, "Persisted user is required");
        Set<GrantedAuthority> authorities = new HashSet<>(oAuth2User.getAuthorities());
        String role = authUser.getRole() == null ? "USER" : authUser.getRole().toUpperCase();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + role));

        String nameAttributeKey = userRequest.getClientRegistration()
                .getProviderDetails()
                .getUserInfoEndpoint()
                .getUserNameAttributeName();
        if (nameAttributeKey == null || nameAttributeKey.isBlank()) {
            nameAttributeKey = "sub";
        }

        return new DefaultOAuth2User(authorities, oAuth2User.getAttributes(), nameAttributeKey);
    }
}
