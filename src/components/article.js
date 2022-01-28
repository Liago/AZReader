import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonImg } from "@ionic/react";

const Article = ({ articleParsed }) => {
	const { title, content, lead_image_url } = articleParsed;

	return (
		<IonCard>
			<IonImg src={lead_image_url} />
			<IonCardHeader>
				<IonCardSubtitle>{title}</IonCardSubtitle>
				<IonCardTitle></IonCardTitle>
			</IonCardHeader>

			<IonCardContent>
				<div dangerouslySetInnerHTML={{ __html: content }}></div>
			</IonCardContent>
		</IonCard>
	)
}
export default Article;