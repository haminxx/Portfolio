import { useLanguage } from '../context/LanguageContext'
import './DesktopHero.css'

export default function DesktopHero() {
  const { t } = useLanguage()

  return (
    <div className="desktop-hero">
      <div className="desktop-hero__layers">
        <div className="desktop-hero__blob desktop-hero__blob--a" />
        <div className="desktop-hero__blob desktop-hero__blob--b" />
        <div className="desktop-hero__blob desktop-hero__blob--c" />
        <div className="desktop-hero__blob desktop-hero__blob--d" />
      </div>
      <div className="desktop-hero__title-wrap">
        <h1 className="desktop-hero__title">{t('desktop.heroTitle')}</h1>
      </div>
    </div>
  )
}
