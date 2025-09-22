import React from 'react'
import {
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
  Tooltip,
  IconButton
} from '@mui/material'
import { Language, Translate } from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext.jsx'

const LanguageSelector = ({ variant = 'select', size = 'small' }) => {
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage()

  if (variant === 'icon') {
    return (
      <FormControl size={size}>
        <Tooltip title="Change Language">
          <IconButton color="inherit">
            <Language />
          </IconButton>
        </Tooltip>
        <Select
          value={currentLanguage}
          onChange={(e) => changeLanguage(e.target.value)}
          variant="standard"
          sx={{ 
            '&:before': { display: 'none' },
            '&:after': { display: 'none' },
            '& .MuiSelect-select': { 
              paddingTop: 0,
              paddingBottom: 0,
              minWidth: 'auto'
            }
          }}
          renderValue={() => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Translate fontSize="small" />
              <Typography variant="caption">
                {availableLanguages.find(lang => lang.code === currentLanguage)?.code.toUpperCase()}
              </Typography>
            </Box>
          )}
        >
          {availableLanguages.map((language) => (
            <MenuItem key={language.code} value={language.code}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="body2">{language.nativeName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {language.name}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )
  }

  return (
    <FormControl size={size} sx={{ minWidth: 120 }}>
      <Select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value)}
        displayEmpty
        startAdornment={<Language sx={{ mr: 1, color: 'text.secondary' }} />}
      >
        {availableLanguages.map((language) => (
          <MenuItem key={language.code} value={language.code}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="body2">{language.nativeName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {language.name}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default LanguageSelector