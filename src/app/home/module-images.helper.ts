
    // Simple helper to map modules to gradient images or colors
    getModuleImage(title: string, index: number): string {
        const titleLower = title.toLowerCase();
        
        // Define some distinct gradients
        const gradients = [
            'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)', // Pinky
            'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)', // Blue-ish
            'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)', // Green-ish
            'linear-gradient(120deg, #fccb90 0%, #d57eeb 100%)', // Orange/Purple
            'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', // Lavender
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Red/Pink
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Cyan
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'  // Emerald
        ];

        // Specific mappings if we had specific images
        if (titleLower.includes('basic')) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'; 
        if (titleLower.includes('dom')) return gradients[2];
        if (titleLower.includes('event')) return gradients[3];
        if (titleLower.includes('function')) return gradients[6];
        if (titleLower.includes('object')) return gradients[4];
        if (titleLower.includes('async')) return gradients[5];

        // Fallback to cycling through gradients
        return gradients[index % gradients.length];
    }
